/**
 * Full Encar catalogue synchronization (one-shot CLI).
 *
 *   DATABASE_URL=... CARAPIS_API_KEY=... npm run db:sync
 *
 * Streams the entire catalogue from Carapis and upserts it into PostgreSQL, then
 * retires listings that vanished upstream. Idempotent — safe to re-run; a run
 * interrupted by a rate limit persists its progress and the next run continues.
 * Once the database holds inventory, the app serves from it automatically.
 */
import { runSync } from '@/lib/sync/engine';
import { prisma } from '@/lib/prisma';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('✗ DATABASE_URL is not set — configure a PostgreSQL database first.');
    process.exit(1);
  }

  console.log('▶ Starting full Encar catalogue sync…');
  const started = Date.now();
  const result = await runSync();
  const seconds = Math.round((Date.now() - started) / 1000);

  console.log('─'.repeat(48));
  console.log(`status : ${result.status}`);
  console.log(`fetched: ${result.fetched}`);
  console.log(`created: ${result.created}`);
  console.log(`updated: ${result.updated}`);
  console.log(`retired: ${result.removed}`);
  if (result.message) console.log(`note   : ${result.message}`);
  console.log(`time   : ${seconds}s`);
  console.log('─'.repeat(48));

  await prisma.$disconnect();
  process.exit(result.status === 'SUCCESS' ? 0 : 1);
}

main().catch(async (error) => {
  console.error('✗ Sync failed:', error);
  await prisma.$disconnect();
  process.exit(1);
});
