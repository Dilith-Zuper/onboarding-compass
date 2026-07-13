import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Funnel instrumentation: the wizard reports the furthest step the customer
 * has reached (0 Welcome … 4 Review). Stored on sessions.last_seen_step and
 * only ever increases, so drop-off can be read per step.
 * Requires the `last_seen_step` column (see schema.sql migration).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createClient();

  const { data: session, error } = await supabase
    .from('sessions')
    .select('id, status')
    .eq('unique_token', params.token)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
  }
  if (session.status === 'submitted' || session.status === 'live') {
    return NextResponse.json({ ok: true });
  }

  const body = await req.json().catch(() => ({}));
  const step = Number(body.step);
  if (!Number.isInteger(step) || step < 0 || step > 4) {
    return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
  }

  // Monotonic: only move forward. Non-fatal if the column doesn't exist yet.
  await supabase
    .from('sessions')
    .update({ last_seen_step: step, updated_at: new Date().toISOString() })
    .eq('id', session.id)
    .or(`last_seen_step.is.null,last_seen_step.lt.${step}`);

  return NextResponse.json({ ok: true });
}
