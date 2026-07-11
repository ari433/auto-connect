import type { Vehicle as PrismaVehicle } from '@prisma/client';
import type { AdminVehicle, Vehicle, VehicleImage } from '@/types/vehicle';

function parseImages(value: PrismaVehicle['images']): VehicleImage[] {
  if (Array.isArray(value)) {
    return value as unknown as VehicleImage[];
  }
  return [];
}

/** Map a database record to the public vehicle shape (no sensitive fields). */
export function toPublicVehicle(v: PrismaVehicle): Vehicle {
  return {
    id: v.id,
    slug: v.slug,
    brand: v.brand,
    model: v.model,
    variant: v.variant,
    year: v.year,
    mileageKm: v.mileageKm,
    fuel: v.fuel,
    transmission: v.transmission,
    drive: v.drive,
    bodyType: v.bodyType,
    engineLabel: v.engineLabel,
    engineCc: v.engineCc,
    horsepower: v.horsepower,
    exteriorColor: v.exteriorColor,
    interiorColor: v.interiorColor,
    doors: v.doors,
    seats: v.seats,
    ownerCount: v.ownerCount,
    hasAccident: v.hasAccident,
    inspectionPassed: v.inspectionPassed,
    price: v.price,
    status: v.status,
    featured: v.featured,
    images: parseImages(v.images),
    equipment: v.equipment,
    description: v.description,
    dealer:
      v.dealerName || v.dealerPhone || v.dealerLocation
        ? { name: v.dealerName, phone: v.dealerPhone, location: v.dealerLocation }
        : null,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
  };
}

/** Map a database record to the admin shape (includes commercial data). */
export function toAdminVehicle(v: PrismaVehicle): AdminVehicle {
  return {
    ...toPublicVehicle(v),
    vin: v.vin,
    sourceRef: v.sourceRef,
    sourcePriceKrw: v.sourcePriceKrw,
    landedCostEur: v.landedCostEur,
    marginEur: v.marginEur,
  };
}
