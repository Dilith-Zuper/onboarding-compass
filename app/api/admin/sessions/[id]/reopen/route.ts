import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminRequest } from '@/lib/auth';

/**
 * Reopen a submitted session so the customer can edit and resubmit.
 * Their answers, renames, and change requests are all preserved; on
 * resubmit the previous submission row is replaced.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('sessions')
    .update({ status: 'in_progress', updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .in('status', ['submitted', 'live'])
    .select('id');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Session is not submitted' }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
