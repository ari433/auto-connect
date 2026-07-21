import { z } from 'zod';

/** Canonical sort options for the catalogue. */
export const SORT_OPTIONS = [
  'newest',
  'price_asc',
  'price_desc',
  'mileage_asc',
  'year_desc',
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number];

const list = (schema: z.ZodString) =>
  z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => {
      if (v == null) return [] as string[];
      const arr = Array.isArray(v) ? v : v.split(',');
      return arr.map((s) => s.trim()).filter(Boolean);
    })
    .pipe(z.array(schema));

/** Query schema shared by the API and server components. */
export const vehicleQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  brand: list(z.string()),
  model: list(z.string()),
  bodyType: list(z.string()),
  fuel: list(z.string()),
  transmission: list(z.string()),
  drive: list(z.string()),
  color: list(z.string()),
  /** Engine (e.g. "2.0 TDI") — exact match against a listing's engineLabel. */
  engine: z.string().trim().max(120).optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  minYear: z.coerce.number().int().optional(),
  maxYear: z.coerce.number().int().optional(),
  minMileage: z.coerce.number().int().nonnegative().optional(),
  maxMileage: z.coerce.number().int().nonnegative().optional(),
  minHp: z.coerce.number().int().nonnegative().optional(),
  featured: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((v) => v === true || v === 'true'),
  sort: z.enum(SORT_OPTIONS).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(12),
});

export type VehicleQuery = z.infer<typeof vehicleQuerySchema>;

/** Parse a URLSearchParams-like record into a validated query. */
export function parseVehicleQuery(
  params: Record<string, string | string[] | undefined>,
): VehicleQuery {
  return vehicleQuerySchema.parse(params);
}
