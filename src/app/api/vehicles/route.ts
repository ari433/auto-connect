import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { parseVehicleQuery } from '@/lib/search/query';
import { searchVehicles } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const query = parseVehicleQuery(params);
    const result = await searchVehicles(query);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Parametra të pavlefshëm', details: error.flatten() },
        { status: 400 },
      );
    }
    console.error('[api/vehicles]', error);
    return NextResponse.json({ error: 'Gabim i brendshëm' }, { status: 500 });
  }
}
