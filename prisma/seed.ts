/**
 * Database seed.
 *
 * Seeding is just a normal synchronization run: it pulls the provider snapshot
 * through the pricing engine and populates the catalogue. This keeps a single
 * ingestion path and guarantees seeded data is identical to synced data.
 */
import { runSync } from '../src/lib/sync/engine';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('→ Running inventory sync (seed)…');
  const result = await runSync();

  if (result.status === 'FAILED') {
    throw new Error(`Sync failed: ${result.message}`);
  }

  console.log(
    `✓ Sync complete — fetched ${result.fetched}, created ${result.created}, updated ${result.updated}, retired ${result.removed}`,
  );

  const total = await prisma.vehicle.count();
  console.log(`✓ Catalogue now holds ${total} vehicles.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
