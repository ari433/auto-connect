import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** Anonymous visitor id cookie (random — carries no personal data). */
const VISITOR_COOKIE = 'ac_vid';
const ONE_YEAR = 60 * 60 * 24 * 365;

function newVisitorId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Record a single page view for the admin analytics. Fire-and-forget from the
 * client: it must never throw back anything that could disturb navigation, so
 * every failure is swallowed and answered with 200.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json().catch(() => ({}))) as {
      path?: unknown;
      referrer?: unknown;
    };
    const path = typeof payload.path === 'string' ? payload.path.slice(0, 512) : '';

    // Ignore empties and the admin area itself.
    if (!path || path.startsWith('/admin') || path.startsWith('/api')) {
      return NextResponse.json({ ok: true });
    }

    let vid = req.cookies.get(VISITOR_COOKIE)?.value;
    const res = NextResponse.json({ ok: true });
    if (!vid) {
      vid = newVisitorId();
      res.cookies.set(VISITOR_COOKIE, vid, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: ONE_YEAR,
        path: '/',
      });
    }

    const referrer =
      typeof payload.referrer === 'string' ? payload.referrer.slice(0, 512) : null;

    await prisma.pageView.create({ data: { path, visitorId: vid, referrer } });
    return res;
  } catch {
    return NextResponse.json({ ok: false });
  }
}
