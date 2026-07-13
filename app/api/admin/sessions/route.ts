import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cleanEnv } from '@/lib/utils';
import { verifyAdminRequest } from '@/lib/auth';
import { buildInviteEmail } from '@/lib/email/templates';
import { sendEmail } from '@/lib/email/sender';

// Everything except zuper_api_key — the key must never leave the server
// after session creation.
const SESSION_COLUMNS =
  'id, org_name, customer_email, sa_email, dc_region, unique_token, has_zuper_connect, status, created_at, updated_at';

export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('sessions')
    .select(SESSION_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sessions: data });
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { org_name, customer_email, sa_email, zuper_api_key, dc_region, has_zuper_connect } = body;

  if (!org_name || !customer_email || !sa_email || !zuper_api_key || !dc_region) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('sessions')
    .insert({ org_name, customer_email, sa_email, zuper_api_key, dc_region, has_zuper_connect: has_zuper_connect ?? false })
    .select(SESSION_COLUMNS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const appUrl = cleanEnv(process.env.NEXT_PUBLIC_APP_URL) || req.nextUrl.origin;
  const wizardLink = `${appUrl}/w/${data.unique_token}`;

  // Fire snapshot fetch in background
  fetch(`${appUrl}/api/zuper/${data.unique_token}/snapshot`, { method: 'GET' }).catch(() => {});

  // Send invite email to customer (non-fatal)
  const invite = buildInviteEmail({ orgName: org_name, wizardLink, saEmail: sa_email });
  sendEmail({ to: customer_email, subject: invite.subject, html: invite.html })
    .then(({ error }) => { if (error) console.error('Invite email failed:', error.message); })
    .catch((err) => console.error('Invite email failed:', err));

  return NextResponse.json({ session: data, wizardLink }, { status: 201 });
}
