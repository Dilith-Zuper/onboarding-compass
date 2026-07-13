import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminRequest } from '@/lib/auth';
import { fetchZuperSnapshot } from '@/lib/zuper/api';

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

  const force = req.nextUrl.searchParams.get('force') === 'true';

  // Force-refresh hits the customer's Zuper API and inserts a new snapshot
  // row — admin only. The unauthenticated path below serves the cached
  // snapshot, or performs the one first fetch if none exists yet.
  if (force && !(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Return cached snapshot unless force-refresh requested
  if (!force) {
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

  return NextResponse.json({ snapshot: saved });
}
