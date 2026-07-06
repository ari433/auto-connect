import { NextResponse, type NextRequest } from 'next/server';
import { runSync } from '@/lib/sync/engine';
import { carapisProvider } from '@/lib/providers/carapis';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Scheduled inventory synchronization (the quota-protecting path).
 *
 * Pulls the filtered set from Carapis, UPSERTS every returned vehicle by its
 * stable id, and marks vehicles that are no longer returned as SOLD — so new
 * cars appear and sold cars disappear automatically. GET /api/inventory then
 * serves instantly from the database when INVENTORY_SOURCE=db.
 *
 * Protected by CRON_SECRET. Vercel Cron sends `Authorization: Bearer <secret>`.
 * Configure the schedule in vercel.json (e.g. every 6 hours).
 */
function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // unset → open (local/dev)
  const auth = req.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

async function handle(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'I paautorizuar' }, { status: 401 });
  }
  const result = await runSync(carapisProvider);
  const status = result.status === 'SUCCESS' ? 200 : 500;
  return NextResponse.json(result, { status });
}

export const GET = handle;
export const POST = handle;
