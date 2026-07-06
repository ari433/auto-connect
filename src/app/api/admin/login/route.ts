import { NextResponse, type NextRequest } from 'next/server';
import { z, ZodError } from 'zod';
import { ADMIN_COOKIE, adminTokenConfigured, isValidAdminToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const schema = z.object({ token: z.string().min(1) });

export async function POST(req: NextRequest) {
  if (!adminTokenConfigured()) {
    // No token configured — admin area is already open.
    return NextResponse.json({ ok: true, open: true });
  }
  try {
    const { token } = schema.parse(await req.json());
    if (!isValidAdminToken(token)) {
      return NextResponse.json({ ok: false, error: 'Token i pasaktë' }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 12,
    });
    return res;
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, error: 'Të dhëna të pavlefshme' }, { status: 400 });
    }
    throw error;
  }
}
