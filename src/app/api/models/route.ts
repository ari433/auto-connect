import { NextResponse, type NextRequest } from 'next/server';
import { getModelsForBrands } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const brands = req.nextUrl.searchParams
    .getAll('brand')
    .flatMap((b) => b.split(','))
    .map((b) => b.trim())
    .filter(Boolean);
  const models = await getModelsForBrands(brands);
  return NextResponse.json({ models });
}
