import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchZuperSnapshot, fetchWorkflowDetail } from '@/lib/zuper/api';
import { explainWorkflow } from '@/lib/ai/explainWorkflow';

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createClient();

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, zuper_api_key, dc_region')
    .eq('unique_token', params.token)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Return cached snapshot if it exists
  const { data: existing } = await supabase
    .from('snapshots')
    .select('*')
    .eq('session_id', session.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    return NextResponse.json({ snapshot: existing });
  }

  // Fetch fresh snapshot from Zuper
  const snapshot = await fetchZuperSnapshot(session.zuper_api_key, session.dc_region);

  const { data: saved, error: saveError } = await supabase
    .from('snapshots')
    .insert({
      session_id: session.id,
      categories: snapshot.categories,
      checklists: snapshot.checklists,
      notifications: snapshot.notifications,
      workflows: snapshot.workflows,
    })
    .select()
    .single();

  if (saveError) {
    return NextResponse.json({ error: saveError.message }, { status: 500 });
  }

  // Fire AI explanations for first 10 workflows asynchronously
  if (snapshot.workflows.length > 0) {
    const toExplain = snapshot.workflows.slice(0, 10);
    Promise.allSettled(
      toExplain.map(async (wf) => {
        const detail = await fetchWorkflowDetail(session.zuper_api_key, session.dc_region, wf.uid);
        const explanation = await explainWorkflow(detail);
        return { uid: wf.uid, explanation };
      })
    ).then(async (results) => {
      const explanations: Record<string, any> = {};
      for (const r of results) {
        if (r.status === 'fulfilled') {
          explanations[r.value.uid] = r.value.explanation;
        }
      }
      await supabase
        .from('snapshots')
        .update({ workflow_explanations: explanations })
        .eq('id', saved.id);
    }).catch(() => {});
  }

  return NextResponse.json({ snapshot: saved });
}
