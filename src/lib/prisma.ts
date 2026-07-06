import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // A placeholder URL keeps construction from throwing when the app runs in
    // database-free "live" mode (no DATABASE_URL). Queries are never issued in
    // that mode; if one is, it fails gracefully behind a safe() wrapper.
    datasources: {
      db: {
        url:
          process.env.DATABASE_URL ||
          'postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder',
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
