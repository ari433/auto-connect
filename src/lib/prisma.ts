import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const PLACEHOLDER_URL = 'postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder';

/**
 * Add a short connect timeout when one isn't already set.
 *
 * Without this, an unreachable/misconfigured database (e.g. a Neon connection
 * string that isn't the pooled one, on a serverless host) can hang a request
 * for a long time instead of failing fast. The catalogue facade (`read()` in
 * `src/lib/catalog`) depends on a quick failure to fall back to the live
 * Carapis provider — a slow hang here is what makes the whole site look dead,
 * not just the database-backed pages.
 */
function withConnectTimeout(url: string): string {
  if (url === PLACEHOLDER_URL || /[?&]connect_timeout=/.test(url)) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}connect_timeout=5`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // A placeholder URL keeps construction from throwing when the app runs in
    // database-free "live" mode (no DATABASE_URL). Queries are never issued in
    // that mode; if one is, it fails gracefully behind a safe() wrapper.
    datasources: {
      db: {
        url: withConnectTimeout(process.env.DATABASE_URL || PLACEHOLDER_URL),
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
