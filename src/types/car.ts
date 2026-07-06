/**
 * Normalized, Albanian-facing vehicle shape returned by GET /api/inventory.
 *
 * This is the ONLY vehicle contract the frontend consumes from the live feed.
 * It is deliberately provider-agnostic: the mapping from the upstream provider
 * (Carapis) into this shape lives entirely in `src/lib/providers/carapis`. If
 * the provider changes its fields or path, this type does not change.
 */
export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  /** Original listing price in South Korean won. */
  priceKRW: number;
  /** Converted price in EUR, using the configurable rate (env). */
  priceEUR: number;
  mileageKm: number;
  /** Albanian label, e.g. "Benzinë", "Naftë (Dizel)". */
  fuel: string;
  /** Albanian label, e.g. "Automatik". */
  transmission: string;
  /** Albanian label, e.g. "E zezë". */
  color: string;
  images: string[];
  /** ISO timestamp derived from the upstream `created_at`. */
  addedAt: string;
  /** Original source listing URL, when provided. */
  encarUrl?: string;
}

/** Optional filters accepted by the inventory feed (mirrors provider params). */
export interface CarQuery {
  brand?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  limit?: number;
  offset?: number;
}
