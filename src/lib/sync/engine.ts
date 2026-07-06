import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { carapisProvider } from '@/lib/providers/carapis';
import type { ProviderVehicle, VehicleProvider } from '@/lib/providers/types';
import { computePrice, getPricingConfig } from '@/lib/pricing/engine';
import { buildVehicleSlug } from '@/lib/vehicles/slug';
import type { VehicleImage } from '@/types/vehicle';

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
function toVehicleData(
  v: ProviderVehicle,
): Prisma.VehicleUncheckedCreateInput {
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

/**
 * Run a full inventory synchronization.
 * Upserts every current listing and retires records that vanished upstream.
 */
export async function runSync(
  provider: VehicleProvider = carapisProvider,
): Promise<SyncResult> {
  const run = await prisma.syncRun.create({
    data: { status: 'RUNNING', provider: provider.id },
  });

  try {
    const inventory = await provider.fetchInventory();
    let created = 0;
    let updated = 0;

    for (const v of inventory) {
      const data = toVehicleData(v);
      const existing = await prisma.vehicle.findUnique({
        where: { sourceRef: v.ref },
        select: { id: true },
      });

      if (existing) {
        // Preserve slug and manual status/featured curation on updates.
        const { slug: _slug, featured: _featured, ...rest } = data;
        await prisma.vehicle.update({ where: { sourceRef: v.ref }, data: rest });
        updated += 1;
      } else {
        await prisma.vehicle.create({ data });
        created += 1;
      }
    }

    // Retire listings that are no longer offered upstream (keep sold history).
    const currentRefs = inventory.map((v) => v.ref);
    const retire = await prisma.vehicle.updateMany({
      where: {
        sourceRef: { notIn: currentRefs },
        status: { in: ['AVAILABLE', 'RESERVED', 'IN_TRANSIT'] },
      },
      data: { status: 'SOLD' },
    });

    const result: SyncResult = {
      runId: run.id,
      status: 'SUCCESS',
      fetched: inventory.length,
      created,
      updated,
      removed: retire.count,
    };

    await prisma.syncRun.update({
      where: { id: run.id },
      data: {
        status: 'SUCCESS',
        fetched: result.fetched,
        created: result.created,
        updated: result.updated,
        removed: result.removed,
        finishedAt: new Date(),
      },
    });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gabim i panjohur';
    await prisma.syncRun.update({
      where: { id: run.id },
      data: { status: 'FAILED', message, finishedAt: new Date() },
    });
    return {
      runId: run.id,
      status: 'FAILED',
      fetched: 0,
      created: 0,
      updated: 0,
      removed: 0,
      message,
    };
  }
}
