import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { cleanEnv } from '@/lib/utils';

const secret = new TextEncoder().encode(cleanEnv(process.env.ADMIN_JWT_SECRET));
const resend = new Resend(cleanEnv(process.env.RESEND_API_KEY));

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

function inviteEmailHtml(orgName: string, wizardLink: string, saEmail: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#FAF9F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:520px;margin:48px auto;padding:0 16px;">
  <div style="background:#1A1A1A;border-radius:12px 12px 0 0;padding:24px 32px;">
    <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#F97316;">Zuper Onboarding</p>
    <p style="margin:6px 0 0;font-size:20px;font-weight:800;color:#FFFFFF;">Your Zuper setup is ready to begin</p>
  </div>
  <div style="background:#FFFFFF;border:1px solid #E5E2DC;border-top:none;border-radius:0 0 12px 12px;padding:32px;">
    <p style="margin:0 0 16px;font-size:14px;color:#6B7280;line-height:1.6;">
      Hi there,<br/><br/>
      Your <strong style="color:#1A1A1A;">${orgName}</strong> Zuper account is being set up. Before we configure everything, we need about 10 minutes of your time to understand how your business works.
    </p>

    <p style="margin:0 0 20px;font-size:14px;color:#6B7280;line-height:1.6;">
      Click the button below to walk through a quick questionnaire. You will see your personalised Zuper workflow, review your account configuration, and request any changes — all before go-live.
    </p>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${wizardLink}"
         style="display:inline-block;background:#F97316;color:#FFFFFF;font-size:15px;font-weight:700;padding:16px 36px;border-radius:9999px;text-decoration:none;">
        Start my onboarding →
      </a>
    </div>

    <!-- Link fallback -->
    <div style="background:#FAF9F7;border:1px solid #E5E2DC;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#9CA3AF;">Or copy this link</p>
      <p style="margin:0;font-size:12px;color:#6B7280;word-break:break-all;">${wizardLink}</p>
    </div>

    <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.5;">
      This link is unique to your account. Do not share it.<br/>
      Questions? Contact your SA at <a href="mailto:${saEmail}" style="color:#F97316;">${saEmail}</a>
    </p>
  </div>
  <p style="text-align:center;font-size:11px;color:#9CA3AF;margin-top:20px;">
    Zuper Onboarding Compass
  </p>
</div>
</body>
</html>`;
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
  resend.emails.send({
    from: cleanEnv(process.env.RESEND_FROM_EMAIL) || 'onboarding@resend.dev',
    to: [customer_email],
    subject: `Your Zuper onboarding link — ${org_name}`,
    html: inviteEmailHtml(org_name, wizardLink, sa_email),
  }).catch((err) => console.error('Invite email failed:', err));

  return NextResponse.json({ session: data, wizardLink }, { status: 201 });
}
