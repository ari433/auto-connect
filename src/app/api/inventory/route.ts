import { NextResponse, type NextRequest } from 'next/server';
import { fetchCars, CarapisError, carapisStatus } from '@/lib/providers/carapis';
import { vehicleToCar } from '@/lib/inventory/from-db';
import { prisma } from '@/lib/prisma';
import type { Car, CarQuery } from '@/types/car';

export const dynamic = 'force-dynamic';

/**
 * GET /api/inventory
 *
 * The ONLY vehicle endpoint the frontend calls. Runs server-side; the Carapis
 * key never reaches the browser. Returns a `Car[]` sorted by price (KRW) in
 * DESCENDING order — highest price first.
 *
 * Source is selected by INVENTORY_SOURCE:
 *   • "db"   → served from the synced catalogue (instant, quota-protecting)
 *   • "live" → pulled from Carapis on each request (default; sold cars drop off)
 *
 * Both modes return the identical `Car` contract.
 */
const SOURCE = process.env.INVENTORY_SOURCE ?? 'live';

function parseQuery(req: NextRequest): CarQuery {
  const p = req.nextUrl.searchParams;
  const numeric = (key: string) => {
    const v = p.get(key);
    return v != null && v !== '' ? Number(v) : undefined;
  };
  return {
    brand: p.get('brand') ?? undefined,
    model: p.get('model') ?? undefined,
    yearMin: numeric('year_min'),
    yearMax: numeric('year_max'),
    priceMin: numeric('price_min'),
    priceMax: numeric('price_max'),
    limit: numeric('limit'),
    offset: numeric('offset'),
  };
}

const byPriceKrwDesc = (a: Car, b: Car) => b.priceKRW - a.priceKRW;

export async function GET(req: NextRequest) {
  const query = parseQuery(req);

  try {
    const cars =
      SOURCE === 'db' ? await fromDatabase(query) : await fromLive(query);

    cars.sort(byPriceKrwDesc);

    return NextResponse.json(cars, {
      headers: {
        // Serve from the edge/browser cache briefly to smooth traffic bursts.
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-Inventory-Source': SOURCE,
      },
    });
  } catch (err) {
    if (err instanceof CarapisError) {
      // Do not leak internal detail on auth failures.
      const message =
        err.code === 'INVALID_API_KEY'
          ? 'Konfigurim i pavlefshëm i çelësit të API.'
          : err.code === 'RATE_LIMIT_EXCEEDED'
            ? 'Kufiri i kërkesave u tejkalua. Provoni sërish pas pak.'
            : 'Shërbimi i inventarit është përkohësisht i padisponueshëm.';

      const headers: Record<string, string> = {};
      if (err.retryAfter) headers['Retry-After'] = String(err.retryAfter);

      return NextResponse.json(
        { error: message, code: err.code },
        { status: err.httpStatus, headers },
      );
    }

    console.error('[api/inventory]', err);
    return NextResponse.json(
      { error: 'Gabim i brendshëm', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}

async function fromLive(query: CarQuery): Promise<Car[]> {
  const { cars } = await fetchCars(query);
  return cars;
}

async function fromDatabase(query: CarQuery): Promise<Car[]> {
  const rows = await prisma.vehicle.findMany({
    where: {
      status: { in: ['AVAILABLE', 'RESERVED', 'IN_TRANSIT'] },
      ...(query.brand ? { brand: { equals: query.brand, mode: 'insensitive' } } : {}),
      ...(query.model ? { model: { equals: query.model, mode: 'insensitive' } } : {}),
      ...(query.yearMin != null || query.yearMax != null
        ? { year: { ...(query.yearMin != null ? { gte: query.yearMin } : {}), ...(query.yearMax != null ? { lte: query.yearMax } : {}) } }
        : {}),
    },
    take: query.limit ?? 200,
    skip: query.offset ?? 0,
  });
  return rows.map(vehicleToCar);
}

/** Lightweight diagnostics (no secrets) — handy while wiring up a key. */
export function HEAD() {
  const status = carapisStatus();
  return new NextResponse(null, {
    headers: {
      'X-Inventory-Source': SOURCE,
      'X-Carapis-Tier': status.tier,
      'X-Carapis-Base': status.baseUrl,
    },
  });
}
