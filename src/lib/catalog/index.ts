/**
 * Catalogue facade — the single entry point every page/route uses to read
 * inventory. It hides whether data comes from the database or the live provider.
 *
 * Mode resolution:
 *   CATALOG_SOURCE=db|live   (explicit override), otherwise
 *   → "db" when DATABASE_URL is set, else "live".
 *
 * So a deployment with just a Carapis key (no database) runs entirely in live
 * mode with zero configuration.
 */
import type { Facets, Vehicle, VehicleListResult } from '@/types/vehicle';
import type { VehicleQuery } from '@/lib/search/query';
import * as db from '@/lib/search/engine';
import * as live from './live';

export type CatalogMode = 'db' | 'live';

function resolveMode(): CatalogMode {
  const explicit = process.env.CATALOG_SOURCE?.trim().toLowerCase();
  if (explicit === 'db' || explicit === 'live') return explicit;
  // No explicit choice: use the database when one is configured, else live.
  return process.env.DATABASE_URL ? 'db' : 'live';
}

export const catalogMode: CatalogMode = resolveMode();

const isLive = catalogMode === 'live';

export function searchVehicles(query: VehicleQuery): Promise<VehicleListResult> {
  return isLive ? live.searchLive(query) : db.searchVehicles(query);
}

export function getFacets(): Promise<Facets> {
  return isLive ? live.facetsLive() : db.getFacets();
}

export function getVehicleBySlug(slug: string): Promise<Vehicle | null> {
  return isLive ? live.bySlugLive(slug) : db.getVehicleBySlug(slug);
}

export function getFeaturedVehicles(limit?: number): Promise<Vehicle[]> {
  return isLive ? live.featuredLive(limit) : db.getFeaturedVehicles(limit);
}

export function getLatestVehicles(limit?: number): Promise<Vehicle[]> {
  return isLive ? live.latestLive(limit) : db.getLatestVehicles(limit);
}

export function getRelatedVehicles(vehicle: Vehicle, limit?: number): Promise<Vehicle[]> {
  return isLive ? live.relatedLive(vehicle, limit) : db.getRelatedVehicles(vehicle, limit);
}

export function getAllVehicleSlugs(): Promise<string[]> {
  return isLive ? live.allSlugsLive() : db.getAllVehicleSlugs();
}

export function getModelsForBrands(brands: string[]): Promise<string[]> {
  return isLive ? live.modelsForBrandsLive(brands) : db.getModelsForBrands(brands);
}
