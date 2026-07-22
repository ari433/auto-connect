import { prisma } from '@/lib/prisma';

/** Views + unique visitors over a window. */
export interface Bucket {
  views: number;
  visitors: number;
}

export interface AnalyticsSummary {
  today: Bucket;
  last7: Bucket;
  last30: Bucket;
  totalViews: number;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function bucket(since?: Date): Promise<Bucket> {
  const where = since ? { createdAt: { gte: since } } : {};
  const [views, visitors] = await Promise.all([
    prisma.pageView.count({ where }),
    prisma.pageView
      .findMany({ where, distinct: ['visitorId'], select: { visitorId: true } })
      .then((rows) => rows.length),
  ]);
  return { views, visitors };
}

/** Headline visitor numbers for the dashboard. */
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const [today, last7, last30, totalViews] = await Promise.all([
    bucket(startOfToday()),
    bucket(daysAgo(7)),
    bucket(daysAgo(30)),
    prisma.pageView.count(),
  ]);
  return { today, last7, last30, totalViews };
}

export interface DayPoint {
  date: string; // YYYY-MM-DD
  views: number;
  visitors: number;
}

/** Per-day views and unique visitors for the last `days` days (oldest first). */
export async function getDailySeries(days = 14): Promise<DayPoint[]> {
  const since = daysAgo(days - 1);
  since.setHours(0, 0, 0, 0);

  const rows = await prisma.$queryRaw<
    { day: Date; views: bigint; visitors: bigint }[]
  >`
    SELECT date_trunc('day', "createdAt") AS day,
           count(*) AS views,
           count(DISTINCT "visitorId") AS visitors
    FROM "PageView"
    WHERE "createdAt" >= ${since}
    GROUP BY 1
    ORDER BY 1
  `;

  const byDay = new Map<string, { views: number; visitors: number }>();
  for (const r of rows) {
    const key = new Date(r.day).toISOString().slice(0, 10);
    byDay.set(key, { views: Number(r.views), visitors: Number(r.visitors) });
  }

  const out: DayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = daysAgo(i);
    const key = d.toISOString().slice(0, 10);
    const hit = byDay.get(key);
    out.push({ date: key, views: hit?.views ?? 0, visitors: hit?.visitors ?? 0 });
  }
  return out;
}

export interface TopPath {
  path: string;
  views: number;
}

/** Most-viewed pages in the last `days` days. */
export async function getTopPaths(days = 30, limit = 8): Promise<TopPath[]> {
  const rows = await prisma.pageView.groupBy({
    by: ['path'],
    where: { createdAt: { gte: daysAgo(days) } },
    _count: { _all: true },
    orderBy: { _count: { path: 'desc' } },
    take: limit,
  });
  return rows.map((r) => ({ path: r.path, views: r._count._all }));
}

export interface TopVehicle {
  slug: string;
  name: string;
  views: number;
}

/** Most-viewed vehicle detail pages in the last `days` days. */
export async function getTopVehicles(days = 30, limit = 8): Promise<TopVehicle[]> {
  const rows = await prisma.pageView.groupBy({
    by: ['path'],
    where: {
      createdAt: { gte: daysAgo(days) },
      path: { startsWith: '/vetura/' },
    },
    _count: { _all: true },
    orderBy: { _count: { path: 'desc' } },
    take: limit,
  });

  const slugs = rows.map((r) => r.path.replace('/vetura/', ''));
  const vehicles = await prisma.vehicle.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true, brand: true, model: true },
  });
  const nameBySlug = new Map(vehicles.map((v) => [v.slug, `${v.brand} ${v.model}`]));

  return rows.map((r) => {
    const slug = r.path.replace('/vetura/', '');
    return {
      slug,
      name: nameBySlug.get(slug) ?? slug,
      views: r._count._all,
    };
  });
}
