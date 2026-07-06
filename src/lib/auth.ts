import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

/**
 * Lightweight admin gate.
 *
 * The admin area is protected by a shared token. In production set ADMIN_TOKEN;
 * the operator signs in once (cookie `ac_admin`) and every mutating admin API
 * verifies it. When ADMIN_TOKEN is unset (local dev) access is open so the
 * dashboard is immediately explorable.
 */

export const ADMIN_COOKIE = 'ac_admin';

export function adminTokenConfigured(): boolean {
  return Boolean(process.env.ADMIN_TOKEN);
}

/** Check a raw token against the configured admin token. */
export function isValidAdminToken(token: string | undefined | null): boolean {
  if (!adminTokenConfigured()) return true;
  return Boolean(token) && token === process.env.ADMIN_TOKEN;
}

/** Guard for API route handlers (header or cookie). */
export function isAuthorizedRequest(req: NextRequest): boolean {
  if (!adminTokenConfigured()) return true;
  const header = req.headers.get('x-admin-token');
  const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
  return isValidAdminToken(header) || isValidAdminToken(cookie);
}

/** Guard for server components (async cookies API). */
export async function isAuthorizedSession(): Promise<boolean> {
  if (!adminTokenConfigured()) return true;
  const store = await cookies();
  return isValidAdminToken(store.get(ADMIN_COOKIE)?.value);
}
