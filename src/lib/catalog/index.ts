/**
 * Catalogue facade — the single entry point every page/route uses to read
 * inventory. It hides whether data comes from the database or the live provider,
 * and keeps the live provider as an automatic backup for the database.
 *
 * Mode resolution:
 *   CATALOG_SOURCE=db|live   (explicit override), otherwise
 *   → "db" when DATABASE_URL is set, else "live".
 *
 * In "db" mode the database is authoritative once it holds inventory. Before the
 * first sync completes (empty database) or during a database outage, reads fall
 * back to the live Carapis provider so the storefront is never empty. Once the
 * sync has populated the catalogue, the database is used automatically.
 */
import type { Facets, Vehicle, VehicleListResult } from '@/types/vehicle';
import type { VehicleQuery } from '@/lib/search/query';
import { prisma } from '@/lib/prisma';
import * as db from '@/lib/search/engine';
import * as live from './live';
import { enrichVehicleDetail } from './enrich';

export type CatalogMode = 'db' | 'live';

function resolveMode(): CatalogMode {
  const explicit = process.env.CATALOG_SOURCE?.trim().toLowerCase();
  if (explicit === 'db' || explicit === 'live') return explicit;
  // No explicit choice: use the database when one is configured, else live.
  return process.env.DATABASE_URL ? 'db' : 'live';
}

export const catalogMode: CatalogMode = resolveMode();

const isDbMode = catalogMode === 'db';

/**
 * Whether the database currently holds public inventory. Cached briefly so the
 * check does not run on every read. In live mode this is always false.
 */
const DB_READY_TTL_MS = 30_000;
let dbReadyCache: { at: number; ready: boolean } | null = null;

async function dbReady(): Promise<boolean> {
  if (!isDbMode) return false;
  if (dbReadyCache && Date.now() - dbReadyCache.at < DB_READY_TTL_MS) {
    return dbReadyCache.ready;
  }
  try {
    const count = await prisma.vehicle.count({
      where: { status: { in: ['AVAILABLE', 'RESERVED', 'IN_TRANSIT'] } },
    });
    const ready = count > 0;
    dbReadyCache = { at: Date.now(), ready };
    return ready;
  } catch (error) {
    console.warn('[catalog] database not reachable — using live backup:', error);
    dbReadyCache = { at: Date.now(), ready: false };
    return false;
  }
}

/**
 * Read from the database when it is the active, populated source; otherwise (or
 * on any database error) fall back to the live provider.
 */
async function read<T>(dbFn: () => Promise<T>, liveFn: () => Promise<T>): Promise<T> {
  if (!(await dbReady())) return liveFn();
  try {
    return await dbFn();
  } catch (error) {
    console.warn('[catalog] database read failed — using live backup:', error);
    return liveFn();
  }
}

export function searchVehicles(query: VehicleQuery): Promise<VehicleListResult> {
  return read(() => db.searchVehicles(query), () => live.searchLive(query));
}

export function getFacets(): Promise<Facets> {
  return read(() => db.getFacets(), () => live.facetsLive());
}

export function getVehicleBySlug(slug: string): Promise<Vehicle | null> {
  return read(
    async () => {
      const vehicle = await db.getVehicleBySlug(slug);
      // Enrich database (listing-level) records with full provider detail.
      if (vehicle) return enrichVehicleDetail(vehicle);
      // Not in the database — try the live provider directly (e.g. deep link).
      return live.bySlugLive(slug);
    },
    () => live.bySlugLive(slug),
  );
}

export function getFeaturedVehicles(limit?: number): Promise<Vehicle[]> {
  return read(() => db.getFeaturedVehicles(limit), () => live.featuredLive(limit));
}

export function getLatestVehicles(limit?: number): Promise<Vehicle[]> {
  return read(() => db.getLatestVehicles(limit), () => live.latestLive(limit));
}

export function getRelatedVehicles(vehicle: Vehicle, limit?: number): Promise<Vehicle[]> {
  return read(
    () => db.getRelatedVehicles(vehicle, limit),
    () => live.relatedLive(vehicle, limit),
  );
}

export function getAllVehicleSlugs(): Promise<string[]> {
  return read(() => db.getAllVehicleSlugs(), () => live.allSlugsLive());
}

export function getModelsForBrands(brands: string[]): Promise<string[]> {
  return read(
    () => db.getModelsForBrands(brands),
    () => live.modelsForBrandsLive(brands),
  );
}
