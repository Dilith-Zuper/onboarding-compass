import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { createClient } from '@/lib/supabase/server';
import { fetchZuperSnapshot } from '@/lib/zuper/api';
import { computeDiff } from '@/lib/zuper/diff';
import { renderToBuffer } from '@react-pdf/renderer';
import { GoLiveReport } from '@/lib/pdf/GoLiveReport';
import { buildGoLiveEmail } from '@/lib/email/goLiveTemplate';
import { Resend } from 'resend';
import { createElement } from 'react';

const secret  = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!);
const resend  = new Resend(process.env.RESEND_API_KEY);

async function verifyAdmin(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value;
  if (!token) return false;
  try { await jwtVerify(token, secret); return true; } catch { return false; }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();

  // 1. Fetch session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', params.id)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  if (session.status === 'live') {
    return NextResponse.json({ error: 'Go-live report already generated' }, { status: 409 });
  }

  // 2. Get original snapshot from DB
  const { data: originalSnapshot } = await supabase
    .from('snapshots')
    .select('*')
    .eq('session_id', params.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  // 3. Fetch fresh snapshot from Zuper
  const freshSnapshot = await fetchZuperSnapshot(session.zuper_api_key, session.dc_region);

  // 4. Compute diff
  const origData = {
    categories:    originalSnapshot?.categories    ?? [],
    notifications: originalSnapshot?.notifications ?? [],
    workflows:     originalSnapshot?.workflows     ?? [],
  };
  const diff = computeDiff(origData, {
    categories:    freshSnapshot.categories,
    notifications: freshSnapshot.notifications,
    workflows:     freshSnapshot.workflows,
  });

  // 5. Get SA email from request body (optional — who clicked the button)
  const body = await req.json().catch(() => ({}));
  const generatedBy = body.generatedBy || session.sa_email;
  const generatedAt = new Date().toISOString();

  // 6. Generate PDF
  let pdfUrl: string | null = null;
  try {
    const buffer = await renderToBuffer(
      createElement(GoLiveReport, {
        orgName:       session.org_name,
        generatedBy,
        generatedAt,
        categories:    freshSnapshot.categories,
        notifications: freshSnapshot.notifications,
        workflows:     freshSnapshot.workflows,
        diff,
      }) as any
    );

    const fileName = `${params.id}/golive-report.pdf`;
    const { error: storageErr } = await supabase.storage
      .from('reports')
      .upload(fileName, buffer, { contentType: 'application/pdf', upsert: true });

    if (!storageErr) {
      const { data: urlData } = supabase.storage.from('reports').getPublicUrl(fileName);
      pdfUrl = urlData?.publicUrl ?? null;
    }
  } catch { /* non-fatal */ }

  // 7. Send email
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@zuper.co';
  try {
    const email = buildGoLiveEmail({ orgName: session.org_name, saEmail: generatedBy, generatedAt, diff, pdfUrl });
    await resend.emails.send({
      from: fromEmail,
      to: ['dilith@zuper.co'],
      subject: email.subject,
      html: email.html,
    });
  } catch { /* non-fatal */ }

  // 8. Insert golive_report record
  const { data: report } = await supabase
    .from('golive_reports')
    .insert({
      session_id:         params.id,
      generated_at:       generatedAt,
      generated_by:       generatedBy,
      snapshot_at_golive: { categories: freshSnapshot.categories, notifications: freshSnapshot.notifications, workflows: freshSnapshot.workflows },
      diff_summary:       diff,
      pdf_url:            pdfUrl,
    })
    .select()
    .single();

  // 9. Update session status to live
  await supabase
    .from('sessions')
    .update({ status: 'live', updated_at: generatedAt })
    .eq('id', params.id);

  return NextResponse.json({ ok: true, reportToken: report?.report_token, pdfUrl });
}
