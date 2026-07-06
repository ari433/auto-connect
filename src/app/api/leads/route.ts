import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import type { LeadStatus } from '@prisma/client';
import { createLead, leadInputSchema, listLeads } from '@/lib/leads/service';
import { isAuthorizedRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = leadInputSchema.parse(body);
    const lead = await createLead(input);
    return NextResponse.json(
      { ok: true, id: lead.id, message: 'Faleminderit! Do t’ju kontaktojmë së shpejti.' },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Të dhëna të pavlefshme', details: error.flatten() },
        { status: 400 },
      );
    }
    console.error('[api/leads:POST]', error);
    return NextResponse.json({ ok: false, error: 'Gabim i brendshëm' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ error: 'I paautorizuar' }, { status: 401 });
  }
  const statusParam = req.nextUrl.searchParams.get('status') as LeadStatus | null;
  const leads = await listLeads(statusParam ?? undefined);
  return NextResponse.json({ leads });
}
