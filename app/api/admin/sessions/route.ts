import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { createClient } from '@/lib/supabase/server';
import { cleanEnv } from '@/lib/utils';
import { buildInviteEmail } from '@/lib/email/templates';
import { sendEmail } from '@/lib/email/sender';

const secret = new TextEncoder().encode(cleanEnv(process.env.ADMIN_JWT_SECRET));

async function verifyAdmin(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sessions: data });
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
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
    .select()
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
