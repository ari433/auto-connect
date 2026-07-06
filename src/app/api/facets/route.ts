import { NextResponse } from 'next/server';
import { getFacets } from '@/lib/search/engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  const facets = await getFacets();
  return NextResponse.json(facets);
}
