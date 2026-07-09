/**
 * Database-free catalogue.
 *
 * Reads inventory straight from the provider (Carapis) on the server, maps it to
 * the public `Vehicle` shape, and answers search / facet / detail queries fully
 * in memory. This lets the entire storefront run with ONLY a Carapis key — no
 * database, no sync. Results are cached briefly to protect the API quota.
 *
 * The exact same code path is exercised in offline dev (it serves the bundled
 * snapshot), so it is not untested when deployed with a real key.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { carapisProvider, fetchVehicleDetail } from '@/lib/providers/carapis';
import { computePrice, getPricingConfig } from '@/lib/pricing/engine';
import { buildVehicleSlug, idFromSlug } from '@/lib/vehicles/slug';
import { isListableVehicle } from '@/lib/vehicles/listable';
import { enrichVehicleDetail } from './enrich';
import {
  bodyTypeLabels,
  driveLabels,
  fuelLabels,
  transmissionLabels,
} from '@/lib/labels';
import type { ProviderVehicle } from '@/lib/providers/types';
import type {
  Facets,
  Vehicle,
  VehicleImage,
  VehicleListResult,
} from '@/types/vehicle';
import type { VehicleQuery } from '@/lib/search/query';

const TTL_MS = Number(process.env.CATALOG_LIVE_TTL_MS ?? 1_800_000);
const LIVE_LIMIT = Number(process.env.CATALOG_LIVE_LIMIT ?? 40);
// Fixed epoch so per-item timestamps are stable across renders (order-based).
const EPOCH = Date.UTC(2026, 0, 1);

function toVehicle(pv: ProviderVehicle, index: number): Vehicle {
  // Use the provider's EUR price directly when given (USD source), otherwise
  // run the KRW landed-cost pricing engine.
  const price = pv.priceEur ?? computePrice(pv.priceKrw, getPricingConfig()).price;
  const images: VehicleImage[] = pv.imageUrls.map((url, i) => ({
    url,
    alt: `${pv.brand} ${pv.model}${pv.variant ? ` ${pv.variant}` : ''} — foto ${i + 1}`,
  }));
  // Preserve provider order for "newest": earlier items look more recent.
  const ts = new Date(EPOCH - index * 60_000).toISOString();

  return {
    id: pv.ref,
    slug: buildVehicleSlug(pv),
    brand: pv.brand,
    model: pv.model,
    variant: pv.variant ?? null,
    year: pv.year,
    mileageKm: pv.mileageKm,
    fuel: pv.fuel,
    transmission: pv.transmission,
    drive: pv.drive,
    bodyType: pv.bodyType,
    engineLabel: pv.engineLabel,
    engineCc: pv.engineCc ?? null,
    horsepower: pv.horsepower ?? null,
    exteriorColor: pv.exteriorColor,
    interiorColor: pv.interiorColor ?? null,
    doors: pv.doors ?? null,
    seats: pv.seats ?? null,
    generation: pv.generation ?? null,
    ownerCount: pv.ownerCount ?? null,
    hasAccident: pv.hasAccident ?? null,
    inspectionPassed: pv.inspectionPassed ?? null,
    price,
    status: 'AVAILABLE',
    featured: pv.featured ?? false,
    images,
    equipment: pv.equipment,
    description: pv.conditionNotes || `${pv.brand} ${pv.model} ${pv.variant ?? ''}`.trim(),
    dealer: pv.dealer
      ? {
          name: pv.dealer.name ?? null,
          phone: pv.dealer.phone ?? null,
          location: pv.dealer.location ?? null,
        }
      : null,
    createdAt: ts,
    updatedAt: ts,
  };
}

let cache: { at: number; items: Vehicle[] } | null = null;
let inflight: Promise<Vehicle[]> | null = null;

// Persist the catalogue to disk so it survives server restarts and rate limits:
// after a single successful load, the storefront is never empty again.
const CACHE_DIR = join(process.cwd(), '.cache');
const CACHE_FILE = join(CACHE_DIR, 'live-inventory.json');

function readDisk(): { at: number; items: Vehicle[] } | null {
  try {
    const parsed = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
    if (Array.isArray(parsed?.items) && parsed.items.length) return parsed;
  } catch {
    /* no cache file yet */
  }
  return null;
}

function writeDisk(items: Vehicle[]): void {
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(CACHE_FILE, JSON.stringify({ at: Date.now(), items }));
  } catch {
    /* best effort */
  }
}

/** Fetch fresh data from the provider and update both caches. */
function refresh(): Promise<Vehicle[]> {
  if (inflight) return inflight;
  inflight = carapisProvider
    .fetchInventory({ limit: LIVE_LIMIT })
    .then((pvs) => {
      // Keep only real, sellable listings (valid year + plausible price).
      const items = pvs.map(toVehicle).filter((v) =>
        isListableVehicle({ year: v.year, price: v.price }),
      );
      if (items.length) {
        cache = { at: Date.now(), items };
        writeDisk(items);
      }
      return cache?.items ?? items;
    })
    .catch((err) => {
      console.warn(
        '[catalog] live refresh failed — serving cached data:',
        err instanceof Error ? err.message : err,
      );
      return cache?.items ?? [];
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Load the catalogue: memory → disk → provider, always serving what we have. */
async function loadAll(): Promise<Vehicle[]> {
  // Warm the in-memory cache from disk on first use.
  if (!cache) cache = readDisk();

  if (cache) {
    // Refresh in the background when stale, but never make the request block.
    if (Date.now() - cache.at >= TTL_MS) void refresh();
    return cache.items;
  }

  // Nothing cached anywhere yet — must fetch (blocking) at least once.
  return refresh();
}

/* ── In-memory query helpers ─────────────────────────────────────────────── */

function matches(v: Vehicle, q: VehicleQuery): boolean {
  if (q.brand.length && !q.brand.includes(v.brand)) return false;
  if (q.model.length && !q.model.includes(v.model)) return false;
  if (q.bodyType.length && !q.bodyType.includes(v.bodyType)) return false;
  if (q.fuel.length && !q.fuel.includes(v.fuel)) return false;
  if (q.transmission.length && !q.transmission.includes(v.transmission)) return false;
  if (q.drive.length && !q.drive.includes(v.drive)) return false;
  if (q.color.length && !q.color.includes(v.exteriorColor)) return false;
  if (q.featured && !v.featured) return false;
  if (q.minPrice != null && v.price < q.minPrice) return false;
  if (q.maxPrice != null && v.price > q.maxPrice) return false;
  if (q.minYear != null && v.year < q.minYear) return false;
  if (q.maxYear != null && v.year > q.maxYear) return false;
  if (q.maxMileage != null && v.mileageKm > q.maxMileage) return false;
  if (q.minHp != null && (v.horsepower ?? 0) < q.minHp) return false;

  if (q.q) {
    const haystack = `${v.brand} ${v.model} ${v.variant ?? ''} ${v.engineLabel} ${v.exteriorColor} ${v.description}`.toLowerCase();
    const terms = q.q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.every((t) => haystack.includes(t))) return false;
  }
  return true;
}

function sortItems(items: Vehicle[], sort: VehicleQuery['sort']): Vehicle[] {
  const arr = [...items];
  switch (sort) {
    case 'price_asc':
      return arr.sort((a, b) => a.price - b.price);
    case 'price_desc':
      return arr.sort((a, b) => b.price - a.price);
    case 'mileage_asc':
      return arr.sort((a, b) => a.mileageKm - b.mileageKm);
    case 'year_desc':
      return arr.sort((a, b) => b.year - a.year || b.createdAt.localeCompare(a.createdAt));
    case 'newest':
    default:
      return arr.sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured) ||
          b.createdAt.localeCompare(a.createdAt),
      );
  }
}

export async function searchLive(query: VehicleQuery): Promise<VehicleListResult> {
  const all = await loadAll();
  const filtered = sortItems(all.filter((v) => matches(v, query)), query.sort);
  const total = filtered.length;
  const start = (query.page - 1) * query.pageSize;
  const items = filtered.slice(start, start + query.pageSize);
  return {
    items,
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

function bucket<T extends string>(
  values: T[],
  label: (v: T) => string,
): { value: string; label: string; count: number }[] {
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: label(value), count }))
    .sort((a, b) => b.count - a.count);
}

export async function facetsLive(): Promise<Facets> {
  const all = await loadAll();
  const prices = all.map((v) => v.price);
  const years = all.map((v) => v.year);
  return {
    brands: bucket(
      all.map((v) => v.brand),
      (b) => b,
    ).sort((a, b) => a.label.localeCompare(b.label)),
    bodyTypes: bucket(all.map((v) => v.bodyType), (b) => bodyTypeLabels[b]),
    fuels: bucket(all.map((v) => v.fuel), (f) => fuelLabels[f]),
    transmissions: bucket(all.map((v) => v.transmission), (t) => transmissionLabels[t]),
    drives: bucket(all.map((v) => v.drive), (d) => driveLabels[d]),
    colors: bucket(all.map((v) => v.exteriorColor), (c) => c).sort((a, b) =>
      a.label.localeCompare(b.label),
    ),
    priceRange: { min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 0 },
    yearRange: {
      min: years.length ? Math.min(...years) : 2015,
      max: years.length ? Math.max(...years) : new Date().getFullYear(),
    },
  };
}

export async function featuredLive(limit = 6): Promise<Vehicle[]> {
  const all = await loadAll();
  const featured = all.filter((v) => v.featured);
  return (featured.length ? featured : all).slice(0, limit);
}

export async function latestLive(limit = 8): Promise<Vehicle[]> {
  const all = await loadAll();
  return sortItems(all, 'newest').slice(0, limit);
}

export async function bySlugLive(slug: string): Promise<Vehicle | null> {
  const id = idFromSlug(slug);

  // Base vehicle from the already-loaded listing — fast, no network. The shared
  // enricher fills in full specs with a bounded, cached upstream call.
  const all = await loadAll();
  const base = id ? all.find((v) => v.id === id) : all.find((v) => v.slug === slug);
  if (base) return enrichVehicleDetail(base);

  // Deep link to a vehicle outside the live window: fetch it by id directly.
  if (id) {
    const detail = await fetchVehicleDetail(id);
    return detail ? { ...toVehicle(detail, 0), slug } : null;
  }
  return null;
}

export async function relatedLive(vehicle: Vehicle, limit = 3): Promise<Vehicle[]> {
  // Use only the already-loaded listing so the detail page never blocks on a
  // fresh full fetch. If the cache is cold, simply show none.
  const all = cache && Date.now() - cache.at < TTL_MS ? cache.items : [];
  const related = all.filter(
    (v) => v.id !== vehicle.id && (v.bodyType === vehicle.bodyType || v.brand === vehicle.brand),
  );
  return (related.length ? related : all.filter((v) => v.id !== vehicle.id)).slice(0, limit);
}

export async function allSlugsLive(): Promise<string[]> {
  const all = await loadAll();
  return all.map((v) => v.slug);
}

export async function modelsForBrandsLive(brands: string[]): Promise<string[]> {
  const all = await loadAll();
  const models = new Set<string>();
  for (const v of all) {
    if (!brands.length || brands.includes(v.brand)) models.add(v.model);
  }
  return [...models].sort();
}
