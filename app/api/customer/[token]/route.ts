import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Never cache: the wizard polls this for snapshot readiness and fresh status
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createClient();

  const { data: session, error } = await supabase
    .from('sessions')
    .select('id, org_name, customer_email, sa_email, status, unique_token, created_at')
    .eq('unique_token', params.token)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: 'Invalid link' }, { status: 404 });
  }

  // Fetch cached snapshot (never re-fetches from Zuper directly)
  const { data: snapshot } = await supabase
    .from('snapshots')
    .select('*')
    .eq('session_id', session.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Fetch existing responses
  const { data: responses } = await supabase
    .from('responses')
    .select('question_id, answer')
    .eq('session_id', session.id);

  // Fetch existing change requests
  const { data: changeRequests } = await supabase
    .from('change_requests')
    .select('module, request_text')
    .eq('session_id', session.id);

  // Mark in_progress if still pending. The .eq('status','pending') guard is
  // load-bearing: it makes the transition idempotent at the DB level, so a
  // stale read can never knock a submitted session back to in_progress.
  if (session.status === 'pending') {
    const now = new Date().toISOString();
    await supabase
      .from('sessions')
      .update({ status: 'in_progress', updated_at: now })
      .eq('id', session.id)
      .eq('status', 'pending');
    // Best-effort funnel timestamp (non-fatal pre-migration)
    await supabase
      .from('sessions')
      .update({ first_opened_at: now })
      .eq('id', session.id)
      .is('first_opened_at', null);
  }

  return NextResponse.json({
    session,
    snapshot: snapshot ?? null,
    responses: responses ?? [],
    changeRequests: changeRequests ?? [],
  });
}
