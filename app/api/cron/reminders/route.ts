import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cleanEnv } from '@/lib/utils';
import { buildReminderEmail } from '@/lib/email/templates';
import { sendEmail } from '@/lib/email/sender';

// Nudge customers whose sessions have stalled. Runs daily via Vercel Cron.
// A session qualifies when it's pending or in_progress, its last reminder
// (or creation) is older than REMINDER_INTERVAL_DAYS, and fewer than
// MAX_REMINDERS have been sent. Requires the reminder_sent_at /
// reminder_count columns (see schema.sql migration).
const REMINDER_INTERVAL_DAYS = 3;
const MAX_REMINDERS = 3;

export async function GET(req: NextRequest) {
  const cronSecret = cleanEnv(process.env.CRON_SECRET);
  const authHeader = req.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();
  const cutoff = new Date(Date.now() - REMINDER_INTERVAL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: stalled, error } = await supabase
    .from('sessions')
    .select('id, org_name, customer_email, sa_email, unique_token, status, created_at, reminder_sent_at, reminder_count')
    .in('status', ['pending', 'in_progress'])
    .lt('created_at', cutoff);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const appUrl = cleanEnv(process.env.NEXT_PUBLIC_APP_URL) || req.nextUrl.origin;
  const results: Array<{ id: string; sent: boolean; reason?: string }> = [];

  for (const s of stalled ?? []) {
    const count = s.reminder_count ?? 0;
    if (count >= MAX_REMINDERS) {
      results.push({ id: s.id, sent: false, reason: 'max reminders reached' });
      continue;
    }
    if (s.reminder_sent_at && s.reminder_sent_at > cutoff) {
      results.push({ id: s.id, sent: false, reason: 'reminded recently' });
      continue;
    }

    const reminder = buildReminderEmail({
      orgName: s.org_name,
      wizardLink: `${appUrl}/w/${s.unique_token}`,
      saEmail: s.sa_email,
      started: s.status === 'in_progress',
    });

    const { error: sendError } = await sendEmail({
      to: s.customer_email,
      cc: s.sa_email ? [s.sa_email] : undefined,
      subject: reminder.subject,
      html: reminder.html,
    });

    if (sendError) {
      results.push({ id: s.id, sent: false, reason: sendError.message });
      continue;
    }

    await supabase
      .from('sessions')
      .update({ reminder_sent_at: new Date().toISOString(), reminder_count: count + 1 })
      .eq('id', s.id);

    results.push({ id: s.id, sent: true });
  }

  return NextResponse.json({ ok: true, checked: stalled?.length ?? 0, results });
}
