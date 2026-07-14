import type {
  BodyType,
  DriveType,
  FuelType,
  Prisma,
  Transmission,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { toPublicVehicle } from '@/lib/vehicles/mapper';
import {
  bodyTypeLabels,
  driveLabels,
  fuelLabels,
  transmissionLabels,
} from '@/lib/labels';
import type {
  Facets,
  Vehicle,
  VehicleListResult,
} from '@/types/vehicle';
import type { VehicleQuery } from './query';

/** Vehicles that are visible in the public catalogue. */
const PUBLIC_STATUSES: Prisma.EnumVehicleStatusFilter = {
  in: ['AVAILABLE', 'RESERVED', 'IN_TRANSIT'],
};

/** Build a Prisma `where` clause from a validated query. */
function buildWhere(query: VehicleQuery): Prisma.VehicleWhereInput {
  const where: Prisma.VehicleWhereInput = { status: PUBLIC_STATUSES, hidden: false };
  const and: Prisma.VehicleWhereInput[] = [];

  if (query.brand.length) where.brand = { in: query.brand };
  if (query.model.length) where.model = { in: query.model };
  if (query.bodyType.length) where.bodyType = { in: query.bodyType as BodyType[] };
  if (query.fuel.length) where.fuel = { in: query.fuel as FuelType[] };
  if (query.transmission.length)
    where.transmission = { in: query.transmission as Transmission[] };
  if (query.drive.length) where.drive = { in: query.drive as DriveType[] };
  if (query.color.length) where.exteriorColor = { in: query.color };
  if (query.featured) where.featured = true;

  if (query.minPrice != null || query.maxPrice != null) {
    where.price = {
      ...(query.minPrice != null ? { gte: query.minPrice } : {}),
      ...(query.maxPrice != null ? { lte: query.maxPrice } : {}),
    };
  }
  if (query.minYear != null || query.maxYear != null) {
    where.year = {
      ...(query.minYear != null ? { gte: query.minYear } : {}),
      ...(query.maxYear != null ? { lte: query.maxYear } : {}),
    };
  }
  if (query.maxMileage != null) where.mileageKm = { lte: query.maxMileage };
  if (query.minHp != null) where.horsepower = { gte: query.minHp };

  if (query.q) {
    const terms = query.q.split(/\s+/).filter(Boolean);
    for (const term of terms) {
      and.push({
        OR: [
          { brand: { contains: term, mode: 'insensitive' } },
          { model: { contains: term, mode: 'insensitive' } },
          { variant: { contains: term, mode: 'insensitive' } },
          { engineLabel: { contains: term, mode: 'insensitive' } },
          { exteriorColor: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ],
      });
    }
  }

  if (and.length) where.AND = and;
  return where;
}

function buildOrderBy(sort: VehicleQuery['sort']): Prisma.VehicleOrderByWithRelationInput[] {
  switch (sort) {
    case 'price_asc':
      return [{ price: 'asc' }];
    case 'price_desc':
      return [{ price: 'desc' }];
    case 'mileage_asc':
      return [{ mileageKm: 'asc' }];
    case 'year_desc':
      return [{ year: 'desc' }, { createdAt: 'desc' }];
    case 'newest':
    default:
      return [{ featured: 'desc' }, { createdAt: 'desc' }];
  }
}

/** Execute a catalogue search. */
export async function searchVehicles(
  query: VehicleQuery,
): Promise<VehicleListResult> {
  const where = buildWhere(query);
  const skip = (query.page - 1) * query.pageSize;

  const [rows, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      orderBy: buildOrderBy(query.sort),
      skip,
      take: query.pageSize,
    }),
    prisma.vehicle.count({ where }),
  ]);

  return {
    items: rows.map(toPublicVehicle),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

/** Aggregate filter facets across the whole public catalogue. */
export async function getFacets(): Promise<Facets> {
  const where: Prisma.VehicleWhereInput = { status: PUBLIC_STATUSES, hidden: false };

  const [brands, bodyTypes, fuels, transmissions, drives, colors, agg] = await Promise.all([
    prisma.vehicle.groupBy({ by: ['brand'], where, _count: true, orderBy: { brand: 'asc' } }),
    prisma.vehicle.groupBy({ by: ['bodyType'], where, _count: true }),
    prisma.vehicle.groupBy({ by: ['fuel'], where, _count: true }),
    prisma.vehicle.groupBy({ by: ['transmission'], where, _count: true }),
    prisma.vehicle.groupBy({ by: ['drive'], where, _count: true }),
    prisma.vehicle.groupBy({ by: ['exteriorColor'], where, _count: true }),
    prisma.vehicle.aggregate({
      where,
      _min: { price: true, year: true },
      _max: { price: true, year: true },
    }),
  ]);

  return {
    brands: brands.map((b) => ({ value: b.brand, label: b.brand, count: b._count })),
    bodyTypes: bodyTypes
      .map((b) => ({
        value: b.bodyType,
        label: bodyTypeLabels[b.bodyType] ?? b.bodyType,
        count: b._count,
      }))
      .sort((a, b) => b.count - a.count),
    fuels: fuels
      .map((f) => ({ value: f.fuel, label: fuelLabels[f.fuel] ?? f.fuel, count: f._count }))
      .sort((a, b) => b.count - a.count),
    transmissions: transmissions.map((t) => ({
      value: t.transmission,
      label: transmissionLabels[t.transmission] ?? t.transmission,
      count: t._count,
    })),
    drives: drives
      .map((d) => ({ value: d.drive, label: driveLabels[d.drive] ?? d.drive, count: d._count }))
      .sort((a, b) => b.count - a.count),
    colors: colors
      .map((c) => ({ value: c.exteriorColor, label: c.exteriorColor, count: c._count }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    priceRange: {
      min: agg._min.price ?? 0,
      max: agg._max.price ?? 0,
    },
    yearRange: {
      min: agg._min.year ?? 2015,
      max: agg._max.year ?? new Date().getFullYear(),
    },
  };
}

/** Fetch a single vehicle for the detail page. */
export async function getVehicleBySlug(slug: string): Promise<Vehicle | null> {
  const row = await prisma.vehicle.findUnique({ where: { slug } });
  if (!row || row.hidden) return null;
  return toPublicVehicle(row);
}

/** Featured vehicles for the homepage. */
export async function getFeaturedVehicles(limit = 6): Promise<Vehicle[]> {
  const rows = await prisma.vehicle.findMany({
    where: { status: PUBLIC_STATUSES, hidden: false, featured: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return rows.map(toPublicVehicle);
}

/** Newest arrivals for the homepage strip. */
export async function getLatestVehicles(limit = 8): Promise<Vehicle[]> {
  const rows = await prisma.vehicle.findMany({
    where: { status: PUBLIC_STATUSES, hidden: false },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return rows.map(toPublicVehicle);
}

/** Related vehicles: same body type or brand, excluding the current one. */
export async function getRelatedVehicles(
  vehicle: Vehicle,
  limit = 3,
): Promise<Vehicle[]> {
  const rows = await prisma.vehicle.findMany({
    where: {
      status: PUBLIC_STATUSES, hidden: false,
      id: { not: vehicle.id },
      OR: [{ bodyType: vehicle.bodyType }, { brand: vehicle.brand }],
    },
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    take: limit,
  });
  return rows.map(toPublicVehicle);
}

/** Slugs for sitemap / static params. */
export async function getAllVehicleSlugs(): Promise<string[]> {
  const rows = await prisma.vehicle.findMany({
    where: { status: PUBLIC_STATUSES, hidden: false },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

/** Distinct models for a brand — used by dependent filters. */
export async function getModelsForBrands(brands: string[]): Promise<string[]> {
  const rows = await prisma.vehicle.findMany({
    where: {
      status: PUBLIC_STATUSES, hidden: false,
      ...(brands.length ? { brand: { in: brands } } : {}),
    },
    select: { model: true },
    distinct: ['model'],
    orderBy: { model: 'asc' },
  });
  return rows.map((r) => r.model);
}
