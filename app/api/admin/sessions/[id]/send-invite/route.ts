import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cleanEnv } from '@/lib/utils';
import { verifyAdminRequest } from '@/lib/auth';
import { buildInviteEmail } from '@/lib/email/templates';
import { sendEmail } from '@/lib/email/sender';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();
  const { data: session, error } = await supabase
    .from('sessions')
    .select('org_name, customer_email, sa_email, unique_token')
    .eq('id', params.id)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const appUrl = cleanEnv(process.env.NEXT_PUBLIC_APP_URL) || req.nextUrl.origin;
  const wizardLink = `${appUrl}/w/${session.unique_token}`;

  const invite = buildInviteEmail({
    orgName: session.org_name,
    wizardLink,
    saEmail: session.sa_email,
  });

  const { error: emailError } = await sendEmail({
    to: session.customer_email,
    subject: invite.subject,
    html: invite.html,
  });

  if (emailError) {
    console.error('Send-invite email error:', emailError.message);
    return NextResponse.json({ error: emailError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
