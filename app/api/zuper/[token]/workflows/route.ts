import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Returns the workflow list + any available AI explanations from the snapshot
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createClient();

  const { data: session, error } = await supabase
    .from('sessions')
    .select('id')
    .eq('unique_token', params.token)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: snapshot } = await supabase
    .from('snapshots')
    .select('workflows, workflow_explanations')
    .eq('session_id', session.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!snapshot) {
    return NextResponse.json({ workflows: [], explanations: {} });
  }

  return NextResponse.json({
    workflows: snapshot.workflows ?? [],
    explanations: snapshot.workflow_explanations ?? {},
  });
}
