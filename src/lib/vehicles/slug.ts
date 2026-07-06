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
  const suffix = v.ref.replace(/[^a-z0-9]/gi, '').slice(-5).toLowerCase();
  return `${slugify(parts)}-${suffix}`;
}
