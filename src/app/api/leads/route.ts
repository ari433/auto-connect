import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import type { LeadStatus } from '@prisma/client';
import { createLead, leadInputSchema, listLeads } from '@/lib/leads/service';
import { isAuthorizedRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const SUCCESS_MESSAGE = 'Faleminderit! Do t’ju kontaktojmë së shpejti.';

export async function POST(req: NextRequest) {
  let input;
  try {
    input = leadInputSchema.parse(await req.json());
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Të dhëna të pavlefshme', details: error.flatten() },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: false, error: 'Kërkesë e pavlefshme' }, { status: 400 });
  }

  try {
    const lead = await createLead(input);
    return NextResponse.json({ ok: true, id: lead.id, message: SUCCESS_MESSAGE }, { status: 201 });
  } catch (error) {
    // No database (live mode) or a transient DB issue: never fail the customer.
    // The submission is recorded to the server log for follow-up.
    console.warn('[api/leads] not persisted — capturing to log:', {
      name: input.name,
      phone: input.phone,
      email: input.email,
      source: input.source,
      vehicleSlug: input.vehicleSlug,
      error: error instanceof Error ? error.message : 'unknown',
    });
    return NextResponse.json({ ok: true, persisted: false, message: SUCCESS_MESSAGE }, { status: 202 });
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
