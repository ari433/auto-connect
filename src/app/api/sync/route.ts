import { NextResponse, type NextRequest } from 'next/server';
import { runSync } from '@/lib/sync/engine';
import { carapisProvider } from '@/lib/providers/carapis';
import { prisma } from '@/lib/prisma';
import { isAuthorizedRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Trigger a synchronization run. */
export async function POST(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ error: 'I paautorizuar' }, { status: 401 });
  }
  // Bounded to the route's maxDuration so the request always returns; the full
  // one-shot catalogue load is `npm run db:sync`. Re-running continues safely.
  const result = await runSync(carapisProvider, { softDeadlineMs: 55_000 });
  const status = result.status === 'SUCCESS' ? 200 : 500;
  return NextResponse.json(result, { status });
}

/** Recent sync history. */
export async function GET(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ error: 'I paautorizuar' }, { status: 401 });
  }
  const runs = await prisma.syncRun.findMany({
    orderBy: { startedAt: 'desc' },
    take: 20,
  });
  return NextResponse.json({ runs });
}
