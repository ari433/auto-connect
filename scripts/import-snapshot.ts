/** Import a permitted, normalized JSON inventory snapshot.
 * Usage: DATABASE_URL=... npx tsx scripts/import-snapshot.ts /absolute/path/snapshot.json
 * JSON must be ProviderVehicle[]; never pass untrusted data directly.
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { z } from 'zod';
import { importVerifiedSnapshot } from '../src/lib/sync/engine';

const vehicle = z.object({
  ref: z.string().min(1).max(200),
  vin: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int(),
  mileageKm: z.number().nonnegative(),
  fuel: z.enum(['BENZINE','DIESEL','HYBRID','PLUG_IN_HYBRID','ELECTRIC','LPG']),
  transmission: z.enum(['AUTOMATIC','MANUAL','DUAL_CLUTCH','CVT']),
  drive: z.enum(['FWD','RWD','AWD','FOUR_WD']),
  bodyType: z.enum(['SEDAN','SUV','HATCHBACK','COUPE','WAGON','VAN','PICKUP','CONVERTIBLE']),
  engineLabel: z.string(),
  exteriorColor: z.string(),
  priceKrw: z.number().positive(),
  imageUrls: z.array(z.string().url()).min(1),
  equipment: z.array(z.string()),
  variant: z.string().optional(),
  engineCc: z.number().optional(),
  horsepower: z.number().optional(),
  interiorColor: z.string().optional(),
  doors: z.number().optional(),
  seats: z.number().optional(),
  generation: z.string().optional(),
  ownerCount: z.number().optional(),
  hasAccident: z.boolean().optional(),
  inspectionPassed: z.boolean().optional(),
  priceEur: z.number().positive().optional(),
  conditionNotes: z.string().optional(),
  dealer: z.object({name:z.string().optional(),phone:z.string().optional(),location:z.string().optional()}).optional(),
  featured: z.boolean().optional(),
}).strict();

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const file = process.argv[2];
  if (!file) throw new Error('Provide the path to an authorized normalized JSON snapshot');
  const raw = await readFile(resolve(file), 'utf8');
  const rows = z.array(vehicle).min(20).max(250000).parse(JSON.parse(raw));
  const result = await importVerifiedSnapshot(rows);
  if (result.status !== 'SUCCESS' || result.fetched !== rows.length) {
    throw new Error('Import incomplete; inspect sync log before proceeding');
  }
  process.stdout.write(JSON.stringify(result) + '\n');
}
main().catch(err => { console.error(err); process.exitCode = 1; });
