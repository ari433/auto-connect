import { NextResponse, type NextRequest } from 'next/server';
import { z, ZodError } from 'zod';
import { prisma } from '@/lib/prisma';
import { isAuthorizedRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  // A positive integer sets a manual price; null clears it (back to source price).
  priceOverride: z.number().int().positive().max(100_000_000).nullable().optional(),
  featured: z.boolean().optional(),
  hidden: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ error: 'I paautorizuar' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const data = patchSchema.parse(await req.json());
    const v = await prisma.vehicle.update({ where: { id }, data });
    return NextResponse.json({
      ok: true,
      vehicle: {
        id: v.id,
        priceOverride: v.priceOverride,
        featured: v.featured,
        hidden: v.hidden,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, error: 'Të dhëna të pavlefshme' }, { status: 400 });
    }
    console.error('[api/admin/vehicles:PATCH]', error);
    return NextResponse.json({ ok: false, error: 'Gabim i brendshëm' }, { status: 500 });
  }
}
