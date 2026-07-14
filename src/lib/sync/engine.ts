import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { carapisProvider } from '@/lib/providers/carapis';
import type { ProviderVehicle, VehicleProvider } from '@/lib/providers/types';
import { computePrice, getPricingConfig } from '@/lib/pricing/engine';
import { buildVehicleSlug } from '@/lib/vehicles/slug';
import { isListableVehicle } from '@/lib/vehicles/listable';
import { buildPriceSanityFilter } from '@/lib/vehicles/price-sanity';
import type { VehicleImage } from '@/types/vehicle';

export interface SyncOptions {
  /** Cap on vehicles pulled this run (default: the provider's configured max). */
  maxVehicles?: number;
  /**
   * Stop cleanly after this many ms and persist what was pulled. Used by the
   * cron (bounded by the function's maxDuration); omit for the full CLI sync.
   */
  softDeadlineMs?: number;
  /**
   * Retire vehicles not seen this run (mark SOLD). Only ever applied when the
   * run pulls the WHOLE catalogue to the end — a partial/bounded run must never
   * retire, or it would wrongly sell off everything it didn't reach.
   */
  retire?: boolean;
}

export interface SyncResult {
  runId: string;
  status: 'SUCCESS' | 'FAILED';
  fetched: number;
  created: number;
  updated: number;
  removed: number;
  message?: string;
}

/** Map a provider vehicle into a fully-priced Prisma vehicle payload. */
function toVehicleData(v: ProviderVehicle): Prisma.VehicleUncheckedCreateInput {
  const breakdown = computePrice(v.priceKrw, getPricingConfig());
  // When the provider gives a ready EUR price (USD source), use it directly.
  const price = v.priceEur ?? breakdown.price;

  const images: VehicleImage[] = v.imageUrls.map((url, i) => ({
    url,
    alt: `${v.brand} ${v.model}${v.variant ? ` ${v.variant}` : ''} — foto ${i + 1}`,
  }));

  const description =
    v.conditionNotes?.trim() ||
    `${v.brand} ${v.model} ${v.variant ?? ''}`.trim();

  return {
    slug: buildVehicleSlug(v),
    sourceRef: v.ref,
    brand: v.brand,
    model: v.model,
    variant: v.variant ?? null,
    year: v.year,
    mileageKm: v.mileageKm,
    fuel: v.fuel,
    transmission: v.transmission,
    drive: v.drive,
    bodyType: v.bodyType,
    engineLabel: v.engineLabel,
    engineCc: v.engineCc ?? null,
    horsepower: v.horsepower ?? null,
    exteriorColor: v.exteriorColor,
    interiorColor: v.interiorColor ?? null,
    doors: v.doors ?? null,
    seats: v.seats ?? null,
    ownerCount: v.ownerCount ?? null,
    hasAccident: v.hasAccident ?? null,
    inspectionPassed: v.inspectionPassed ?? null,
    dealerName: v.dealer?.name ?? null,
    dealerPhone: v.dealer?.phone ?? null,
    dealerLocation: v.dealer?.location ?? null,
    vin: v.vin,
    equipment: v.equipment,
    images: images as unknown as Prisma.InputJsonValue,
    description,
    sourcePriceKrw: v.priceKrw || null,
    landedCostEur: v.priceEur ? null : breakdown.landedCostEur,
    price,
    marginEur: v.priceEur ? 0 : breakdown.marginEur,
    featured: v.featured ?? false,
    syncedAt: new Date(),
  };
}

// Prisma's default interactive-transaction window (5s) is too tight for a full
// page of upserts; give each batch room without being unbounded.
const UPSERT_TX_TIMEOUT_MS = 60_000;

/**
 * Upsert one page in a single transaction. Idempotent by `sourceRef`, so a
 * re-run refreshes rather than duplicates. Slug and manual `featured` curation
 * are preserved on update; everything else is refreshed from the source.
 */
async function upsertBatch(batch: ProviderVehicle[]): Promise<void> {
  if (!batch.length) return;
  await prisma.$transaction(
    async (tx) => {
      for (const v of batch) {
        const data = toVehicleData(v);
        const { slug: _slug, featured: _featured, ...update } = data;
        await tx.vehicle.upsert({ where: { sourceRef: v.ref }, create: data, update });
      }
    },
    { timeout: UPSERT_TX_TIMEOUT_MS },
  );
}

/**
 * Yield inventory page-by-page, using the provider's stream when available.
 * Returns true when the WHOLE catalogue was pulled (so the caller may retire
 * stale rows), false when it stopped early on an internal cap.
 */
async function* streamProvider(
  provider: VehicleProvider,
  maxVehicles?: number,
): AsyncGenerator<ProviderVehicle[], boolean> {
  if (provider.streamInventory) {
    return yield* provider.streamInventory({ limit: maxVehicles });
  }
  // Fallback for providers that only fetch into memory: chunk the array.
  const all = await provider.fetchInventory({ limit: maxVehicles });
  for (let i = 0; i < all.length; i += 200) yield all.slice(i, i + 200);
  return maxVehicles == null || all.length < maxVehicles;
}

/**
 * Delete listings whose price is a corrupted outlier vs same-model peers
 * (≈10×-inflated source prices). Runs once per sync over the whole catalogue.
 * Returns how many were removed.
 */
export async function prunePriceOutliers(): Promise<number> {
  const rows = await prisma.vehicle.findMany({
    select: { id: true, brand: true, model: true, price: true, priceOverride: true },
  });
  const keep = buildPriceSanityFilter(
    rows.map((r) => ({ brand: r.brand, model: r.model, price: r.priceOverride ?? r.price })),
  );
  // Never drop a manually-priced vehicle — the admin override is authoritative.
  const badIds = rows
    .filter((r) => r.priceOverride == null && !keep({ brand: r.brand, model: r.model, price: r.price }))
    .map((r) => r.id);
  let removed = 0;
  for (let i = 0; i < badIds.length; i += 500) {
    const res = await prisma.vehicle.deleteMany({
      where: { id: { in: badIds.slice(i, i + 500) } },
    });
    removed += res.count;
  }
  return removed;
}

function isRateLimit(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { code?: string }).code === 'RATE_LIMIT_EXCEEDED'
  );
}

/**
 * Run an inventory synchronization.
 *
 * Streams the catalogue from the provider and upserts it page-by-page, holding
 * only one page in memory — so it scales to the full 100k+ Encar catalogue.
 * When the whole catalogue is pulled to the end, listings that vanished upstream
 * are retired (marked SOLD). A partial run (deadline or rate limit) persists
 * what it pulled and skips retirement, and the next run continues idempotently.
 */
export async function runSync(
  provider: VehicleProvider = carapisProvider,
  options: SyncOptions = {},
): Promise<SyncResult> {
  const retire = options.retire !== false;
  const deadline = options.softDeadlineMs ? Date.now() + options.softDeadlineMs : Infinity;
  const runStart = new Date();

  const run = await prisma.syncRun.create({
    data: { status: 'RUNNING', provider: provider.id },
  });
  const before = await prisma.vehicle.count();

  let fetched = 0;
  let completed = false;
  let message: string | undefined;

  try {
    // Iterate manually so we can read the stream's completion flag (its return
    // value) — retirement must only run when the whole catalogue was pulled.
    const iter = streamProvider(provider, options.maxVehicles);
    let r = await iter.next();
    while (!r.done) {
      // Keep only real, sellable listings (valid year + plausible price) —
      // the feed carries occasional artifacts (non-cars, placeholder prices).
      const valid = r.value.filter((v) =>
        isListableVehicle({ year: v.year, price: v.priceEur ?? 0 }),
      );
      await upsertBatch(valid);
      fetched += valid.length;
      if (Date.now() > deadline) {
        message = `Ndërprerë pas afatit kohor — ${fetched} vetura u sinkronizuan.`;
        break;
      }
      r = await iter.next();
    }
    completed = r.done === true && r.value === true;
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    message = isRateLimit(err)
      ? `Kufizim kërkesash — ${fetched} vetura u sinkronizuan para ndalimit.`
      : detail;
    // If nothing was persisted at all, this is a genuine failure.
    if (fetched === 0) {
      await prisma.syncRun.update({
        where: { id: run.id },
        data: { status: 'FAILED', message: detail, finishedAt: new Date() },
      });
      return { runId: run.id, status: 'FAILED', fetched: 0, created: 0, updated: 0, removed: 0, message: detail };
    }
    // Otherwise keep the partial progress and skip retirement.
  }

  // Count right after the upserts (before prune/retire) so created/updated
  // reflect the actual sync, not the later cleanup.
  const afterUpsert = await prisma.vehicle.count();
  const created = Math.max(0, afterUpsert - before);
  const updated = Math.max(0, fetched - created);

  // Drop listings with corrupted (outlier) source prices from the catalogue.
  const pruned = fetched > 0 ? await prunePriceOutliers() : 0;
  if (pruned) {
    message = `${message ? message + ' ' : ''}${pruned} çmime të gabuara u hoqën.`;
  }

  // Retire listings that vanished upstream — ONLY after a genuinely complete
  // pull that actually returned vehicles. Never on an empty or partial run, or
  // we would sell off inventory that simply wasn't reached this time.
  let removed = 0;
  if (completed && retire && fetched > 0) {
    const result = await prisma.vehicle.updateMany({
      where: {
        syncedAt: { lt: runStart },
        status: { in: ['AVAILABLE', 'RESERVED', 'IN_TRANSIT'] },
      },
      data: { status: 'SOLD' },
    });
    removed = result.count;
  }

  await prisma.syncRun.update({
    where: { id: run.id },
    data: {
      status: 'SUCCESS',
      fetched,
      created,
      updated,
      removed,
      message,
      finishedAt: new Date(),
    },
  });

  return { runId: run.id, status: 'SUCCESS', fetched, created, updated, removed, message };
}
