import { NextResponse } from 'next/server';
import { getVehicleBySlug, getRelatedVehicles } from '@/lib/search/engine';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);

  if (!vehicle) {
    return NextResponse.json({ error: 'Vetura nuk u gjet' }, { status: 404 });
  }

  const related = await getRelatedVehicles(vehicle);
  return NextResponse.json({ vehicle, related });
}
