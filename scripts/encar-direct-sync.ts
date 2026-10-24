/**
 * Full Encar catalogue synchronization — DIRECT source (no Carapis).
 *
 *   DATABASE_URL=... npm run db:sync:direct
 *
 * Pulls inventory straight from Encar's own public API (see
 * src/lib/providers/encar-direct) and upserts it into PostgreSQL via the same
 * sync engine Carapis uses. Meant to run on a long-lived host (a VPS, cron'd
 * once a day) — NOT on Vercel serverless, since a full run paces one request
 * per vehicle to stay polite to an undocumented API and can take minutes.
 */
import { runSync } from '@/lib/sync/engine';
import { encarDirectProvider } from '@/lib/providers/encar-direct';
import { prisma } from '@/lib/prisma';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('✗ DATABASE_URL is not set — configure a PostgreSQL database first.');
    process.exit(1);
  }

  console.log('▶ Starting direct Encar catalogue sync (no Carapis)…');
  const started = Date.now();
  const result = await runSync(encarDirectProvider);
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
