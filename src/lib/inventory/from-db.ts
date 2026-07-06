import type { Vehicle as PrismaVehicle } from '@prisma/client';
import type { Car } from '@/types/car';
import { fuelLabels, transmissionLabels } from '@/lib/labels';
import { convertKrwToEur } from '@/lib/providers/carapis';

/**
 * Map a persisted catalogue record to the public `Car` contract.
 *
 * Used when GET /api/inventory serves from the database (the quota-protecting
 * mode fed by the cron sync). The response shape is byte-for-byte identical to
 * the live path, so switching modes needs zero frontend changes.
 */
export function vehicleToCar(v: PrismaVehicle): Car {
  const priceKRW = v.sourcePriceKrw ?? 0;
  const images = Array.isArray(v.images)
    ? (v.images as unknown as { url: string }[]).map((i) => i.url).filter(Boolean)
    : [];

  return {
    id: v.sourceRef,
    brand: v.brand,
    model: v.model,
    year: v.year,
    priceKRW,
    // Honour the simple, configurable rate for the Car contract, even from DB.
    priceEUR: priceKRW ? convertKrwToEur(priceKRW) : v.price,
    mileageKm: v.mileageKm,
    fuel: fuelLabels[v.fuel],
    transmission: transmissionLabels[v.transmission],
    color: v.exteriorColor,
    images,
    addedAt: v.createdAt.toISOString(),
  };
}
