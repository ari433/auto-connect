import { NextResponse, type NextRequest } from 'next/server';
import { getDependentOptions } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

/**
 * Dependent options for the Marka → Modeli → Tipi → Motori filter dropdowns.
 * Each level is narrowed by the upstream selection passed as query params.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const brand = sp.get('brand')?.trim() || undefined;
  const model = sp.get('model')?.trim() || undefined;
  const bodyType = sp.get('bodyType')?.trim() || undefined;

  const options = await getDependentOptions({ brand, model, bodyType });
  return NextResponse.json(options);
}
