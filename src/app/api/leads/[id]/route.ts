import { NextResponse, type NextRequest } from 'next/server';
import { z, ZodError } from 'zod';
import { updateLeadStatus } from '@/lib/leads/service';
import { isAuthorizedRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST']),
  notes: z.string().max(2000).optional(),
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
    const body = await req.json();
    const { status, notes } = patchSchema.parse(body);
    const lead = await updateLeadStatus(id, status, notes);
    return NextResponse.json({ ok: true, lead });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, error: 'Të dhëna të pavlefshme' }, { status: 400 });
    }
    console.error('[api/leads:PATCH]', error);
    return NextResponse.json({ ok: false, error: 'Gabim i brendshëm' }, { status: 500 });
  }
}
