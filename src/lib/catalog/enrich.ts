/**
 * On-demand detail enrichment.
 *
 * Listing/sync data is deliberately lean (the bulk catalog feed omits drivetrain,
 * engine size, seats, ownership, full gallery, etc.). When a visitor opens a
 * vehicle we fetch its full record from the provider's per-vehicle endpoint and
 * merge the richer fields onto the base — so both the live and database detail
 * pages show complete, real specifications from a single implementation.
 *
 * The upstream call is bounded by a timeout and cached, so a slow or rate-limited
 * provider never blocks the page: the base data renders instead.
 */
import { fetchVehicleDetail } from '@/lib/providers/carapis';
import { idFromSlug } from '@/lib/vehicles/slug';
import type { Vehicle, VehicleImage } from '@/types/vehicle';

const TTL_MS = Number(process.env.CATALOG_LIVE_TTL_MS ?? 1_800_000);
// The per-vehicle endpoint responds in ~3s; allow comfortable margin so full
// specs actually arrive. The result is cached (TTL_MS), so only the first view
// of each vehicle pays this — and a genuine timeout still serves base data.
const TIMEOUT_MS = Number(process.env.CATALOG_DETAIL_TIMEOUT_MS ?? 8000);

const cache = new Map<string, { at: number; vehicle: Vehicle }>();

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
    );
  });
}

/**
 * Return `base` enriched with the full provider detail record. The base identity
 * and pricing (id, slug, price, status, featured) are always preserved; only
 * missing/richer specification fields are filled in.
 */
export async function enrichVehicleDetail(base: Vehicle): Promise<Vehicle> {
  const ref = idFromSlug(base.slug);
  if (!ref) return base;

  const cached = cache.get(ref);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.vehicle;

  const detail = await withTimeout(fetchVehicleDetail(ref), TIMEOUT_MS);
  if (!detail) return base;

  const images: VehicleImage[] = detail.imageUrls.length
    ? detail.imageUrls.map((url, i) => ({
        url,
        alt: `${base.brand} ${base.model}${base.variant ? ` ${base.variant}` : ''} — foto ${i + 1}`,
      }))
    : base.images;

  const merged: Vehicle = {
    ...base,
    variant: base.variant ?? detail.variant ?? null,
    engineLabel: detail.engineLabel || base.engineLabel,
    engineCc: detail.engineCc ?? base.engineCc,
    horsepower: detail.horsepower ?? base.horsepower,
    drive: detail.drive ?? base.drive,
    interiorColor: detail.interiorColor ?? base.interiorColor,
    doors: detail.doors ?? base.doors,
    seats: detail.seats ?? base.seats,
    generation: detail.generation ?? base.generation,
    ownerCount: detail.ownerCount ?? base.ownerCount,
    hasAccident: detail.hasAccident ?? base.hasAccident,
    inspectionPassed: detail.inspectionPassed ?? base.inspectionPassed,
    equipment: detail.equipment.length ? detail.equipment : base.equipment,
    description: detail.conditionNotes || base.description,
    dealer: detail.dealer
      ? {
          name: detail.dealer.name ?? null,
          phone: detail.dealer.phone ?? null,
          location: detail.dealer.location ?? null,
        }
      : base.dealer,
    images,
  };

  cache.set(ref, { at: Date.now(), vehicle: merged });
  return merged;
}
