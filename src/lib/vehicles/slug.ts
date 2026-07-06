import { slugify } from '@/lib/utils';

/** Stable, human-readable, unique slug for a vehicle from its source data. */
export function buildVehicleSlug(v: {
  brand: string;
  model: string;
  variant?: string | null;
  year: number;
  ref: string;
}): string {
  const parts = [v.brand, v.model, v.variant, String(v.year)]
    .filter(Boolean)
    .join(' ');
  // The full source id is carried after a `--` delimiter so the detail page can
  // fetch the vehicle directly by id, without depending on the listing cache.
  return `${slugify(parts)}--${v.ref.toLowerCase()}`;
}

/** Extract the source id from a slug produced by `buildVehicleSlug`. */
export function idFromSlug(slug: string): string | null {
  const i = slug.indexOf('--');
  return i >= 0 ? slug.slice(i + 2) : null;
}
