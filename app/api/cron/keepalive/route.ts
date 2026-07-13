import { NextRequest, NextResponse } from 'next/server';
import { cleanEnv } from '@/lib/utils';

// Supabase free-tier projects auto-pause after a few days of inactivity.
// This route is hit daily by Vercel Cron — requesting an admin OTP touches
// the DB (admin_otps insert) and emails a fresh code to the SA inbox.
const KEEPALIVE_EMAIL = 'dilith@zuper.co';

export async function GET(req: NextRequest) {
  const cronSecret = cleanEnv(process.env.CRON_SECRET);
  const authHeader = req.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const appUrl = cleanEnv(process.env.NEXT_PUBLIC_APP_URL) || req.nextUrl.origin;

  const res = await fetch(`${appUrl}/api/admin/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'request', email: KEEPALIVE_EMAIL }),
  });

  const data = await res.json().catch(() => ({}));

  return NextResponse.json({ ok: res.ok, status: res.status, data });
}
