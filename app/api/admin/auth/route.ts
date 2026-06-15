import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { createClient } from '@/lib/supabase/server';
import { cleanEnv } from '@/lib/utils';
import { roleForEmail } from '@/lib/auth';
import { sendEmail } from '@/lib/email/sender';

const secret = new TextEncoder().encode(cleanEnv(process.env.ADMIN_JWT_SECRET));
const ALLOWED_DOMAIN = 'zuper.co';
const OTP_TTL_MINUTES = 10;

// Master admin — signs in with a password instead of an emailed OTP.
const MASTER_ADMIN_EMAIL = 'dilith@zuper.co';
const MASTER_ADMIN_PASSWORD = 'dilith@zuper.co';

async function issueSession(email: string): Promise<NextResponse> {
  const token = await new SignJWT({ role: roleForEmail(email), email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(secret);

  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  });

  return res;
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function isZuperEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);
}

function otpEmailHtml(email: string, otp: string, magicLink: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#FAF9F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:480px;margin:48px auto;padding:0 16px;">
  <div style="background:#1A1A1A;border-radius:12px 12px 0 0;padding:24px 32px;">
    <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#F97316;">Onboarding Compass</p>
    <p style="margin:6px 0 0;font-size:20px;font-weight:800;color:#FFFFFF;">Your sign-in code</p>
  </div>
  <div style="background:#FFFFFF;border:1px solid #E5E2DC;border-top:none;border-radius:0 0 12px 12px;padding:32px;text-align:center;">
    <p style="margin:0 0 20px;font-size:13px;color:#6B7280;">Signing in as <strong style="color:#1A1A1A;">${email}</strong></p>

    <!-- Code block -->
    <div style="background:#FAF9F7;border:2px solid #E5E2DC;border-radius:12px;padding:20px 24px;margin-bottom:20px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#9CA3AF;">Your code</p>
      <p style="margin:0;font-size:44px;font-weight:800;color:#1A1A1A;letter-spacing:14px;font-variant-numeric:tabular-nums;">${otp}</p>
    </div>

    <!-- Magic link button -->
    <a href="${magicLink}"
       style="display:inline-block;background:#F97316;color:#FFFFFF;font-size:15px;font-weight:700;padding:14px 32px;border-radius:9999px;text-decoration:none;margin-bottom:20px;">
      Sign in directly →
    </a>
    <p style="margin:0 0 4px;font-size:12px;color:#9CA3AF;">
      Click the button above to sign in instantly, or enter the code manually.
    </p>
    <p style="margin:0;font-size:11px;color:#D1D5DB;">Expires in ${OTP_TTL_MINUTES} minutes · Do not share</p>
  </div>
</div>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  // ── Sign out ──────────────────────────────────────────────────────────────
  if (action === 'signout') {
    const res = NextResponse.json({ ok: true });
    res.cookies.set('admin_token', '', { maxAge: 0, path: '/' });
    return res;
  }

  // ── Master admin login (password, no OTP) ──────────────────────────────────
  if (action === 'master_login') {
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? '';

    if (email !== MASTER_ADMIN_EMAIL || password !== MASTER_ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    return issueSession(email);
  }

  // ── Request OTP ───────────────────────────────────────────────────────────
  if (action === 'request') {
    const email = body.email?.trim().toLowerCase();

    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });
    if (!isZuperEmail(email)) {
      return NextResponse.json({ error: 'Only @zuper.co email addresses can access this tool.' }, { status: 403 });
    }

    const supabase = createClient();

    // Rate-limit: block if a fresh OTP (< 60s old) already exists for this email
    const { data: recent } = await supabase
      .from('admin_otps')
      .select('created_at')
      .eq('email', email)
      .eq('used', false)
      .gt('created_at', new Date(Date.now() - 60_000).toISOString())
      .limit(1)
      .single();

    if (recent) {
      return NextResponse.json({ error: 'A code was just sent. Please wait 60 seconds.' }, { status: 429 });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000).toISOString();

    const { error: insertError } = await supabase
      .from('admin_otps')
      .insert({ email, otp, expires_at: expiresAt });

    if (insertError) {
      console.error('admin_otps insert error:', insertError);
      return NextResponse.json(
        { error: 'Database error — make sure you have run the admin_otps SQL in Supabase. See lib/supabase/schema.sql.' },
        { status: 500 }
      );
    }

    const appUrl = cleanEnv(process.env.NEXT_PUBLIC_APP_URL) || req.nextUrl.origin;
    const magicLink = `${appUrl}/admin/login?email=${encodeURIComponent(email)}&code=${otp}`;

    const { error: sendError } = await sendEmail({
      to: email,
      subject: `${otp} is your Onboarding Compass code`,
      html: otpEmailHtml(email, otp, magicLink),
    });

    if (sendError) {
      console.error('OTP email error:', sendError.message);
      return NextResponse.json(
        { error: `Failed to send code: ${sendError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  }

  // ── Verify OTP ────────────────────────────────────────────────────────────
  if (action === 'verify') {
    const email = body.email?.trim().toLowerCase();
    const code  = body.code?.trim();

    if (!email || !code) return NextResponse.json({ error: 'Email and code required' }, { status: 400 });
    if (!isZuperEmail(email)) return NextResponse.json({ error: 'Invalid email' }, { status: 403 });

    const supabase = createClient();

    const { data: record, error: queryError } = await supabase
      .from('admin_otps')
      .select('id, otp, expires_at, used')
      .eq('email', email)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (queryError) {
      console.error('admin_otps query error:', queryError);
      return NextResponse.json(
        { error: 'Database error — make sure you have run the admin_otps SQL in Supabase.' },
        { status: 500 }
      );
    }

    if (!record) {
      return NextResponse.json({ error: 'No active code found. Request a new one.' }, { status: 400 });
    }
    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Code expired. Request a new one.' }, { status: 400 });
    }
    if (record.otp !== code) {
      return NextResponse.json({ error: 'Incorrect code. Check your email and try again.' }, { status: 400 });
    }

    // Mark used
    await supabase.from('admin_otps').update({ used: true }).eq('id', record.id);

    // Issue JWT with email + role claim (super_admin if email is in SUPER_ADMIN_EMAILS)
    return issueSession(email);
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
