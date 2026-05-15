import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Upsert a single response during the wizard so the customer can resume
 * if they close the tab. Keyed on (session_id, question_id) — unique
 * constraint already exists in schema.
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
    return NextResponse.json({ error: 'Already submitted' }, { status: 403 });
  }

  const { question_id, answer } = await req.json();
  if (!question_id) return NextResponse.json({ error: 'question_id required' }, { status: 400 });

  // Treat null/undefined/empty array as "delete"
  const isEmpty =
    answer === null ||
    answer === undefined ||
    answer === '' ||
    (Array.isArray(answer) && answer.length === 0);

  if (isEmpty) {
    await supabase
      .from('responses')
      .delete()
      .eq('session_id', session.id)
      .eq('question_id', question_id);
  } else {
    // Upsert (delete + insert) to avoid race with unique constraint
    await supabase
      .from('responses')
      .delete()
      .eq('session_id', session.id)
      .eq('question_id', question_id);

    await supabase
      .from('responses')
      .insert({ session_id: session.id, question_id, answer });
  }

  return NextResponse.json({ ok: true });
}
