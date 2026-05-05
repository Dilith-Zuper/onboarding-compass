import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createClient();

  const { data: session, error } = await supabase
    .from('sessions')
    .select('id')
    .eq('unique_token', params.token)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
  }

  const { module, request_text } = await req.json();
  if (!module) return NextResponse.json({ error: 'module required' }, { status: 400 });

  // Delete existing record for this module, then insert if non-empty
  await supabase
    .from('change_requests')
    .delete()
    .eq('session_id', session.id)
    .eq('module', module);

  if (request_text?.trim()) {
    await supabase
      .from('change_requests')
      .insert({ session_id: session.id, module, request_text: request_text.trim() });
  }

  return NextResponse.json({ ok: true });
}
