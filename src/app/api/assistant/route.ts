import { NextResponse, type NextRequest } from 'next/server';
import { z, ZodError } from 'zod';
import { recommend } from '@/lib/assistant/engine';

export const dynamic = 'force-dynamic';

const schema = z.object({
  message: z.string().trim().min(1, 'Shkruani një mesazh').max(500),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message } = schema.parse(body);
    const reply = await recommend(message);
    return NextResponse.json(reply);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Mesazh i pavlefshëm' }, { status: 400 });
    }
    console.error('[api/assistant]', error);
    return NextResponse.json({ error: 'Gabim i brendshëm' }, { status: 500 });
  }
}
