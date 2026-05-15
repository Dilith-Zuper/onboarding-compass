import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { OnboardingReport } from '@/lib/pdf/OnboardingReport';
import { buildSAEmail, buildCustomerEmail } from '@/lib/email/templates';
import { Resend } from 'resend';
import { createElement } from 'react';
import { cleanEnv } from '@/lib/utils';

const resend = new Resend(cleanEnv(process.env.RESEND_API_KEY));

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createClient();

  // 1. Validate session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('unique_token', params.token)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
  }
  if (session.status === 'submitted') {
    return NextResponse.json({ error: 'Already submitted' }, { status: 409 });
  }

  const { customerName, answers, changeRequests } = await req.json();

  // 2. Upsert all responses
  const responseRows = Object.entries(answers as Record<string, any>).map(([question_id, answer]) => ({
    session_id: session.id,
    question_id,
    answer,
  }));

  if (responseRows.length > 0) {
    await supabase
      .from('responses')
      .upsert(responseRows, { onConflict: 'session_id,question_id' });
  }

  // 3. Finalise change requests (delete + re-insert all)
  await supabase.from('change_requests').delete().eq('session_id', session.id);
  const crRows = Object.entries(changeRequests as Record<string, string>)
    .filter(([, text]) => text?.trim())
    .map(([module, request_text]) => ({ session_id: session.id, module, request_text: request_text.trim() }));
  if (crRows.length > 0) {
    await supabase.from('change_requests').insert(crRows);
  }

  // 4. Generate PDF
  const submittedAt = new Date().toISOString();
  let pdfUrl: string | null = null;

  try {
    const buffer = await renderToBuffer(
      createElement(OnboardingReport, {
        orgName: session.org_name,
        customerName,
        saEmail: session.sa_email,
        answers,
        changeRequests,
        submittedAt,
      }) as any
    );

    const fileName = `${session.id}/onboarding-report.pdf`;
    const { error: storageError } = await supabase.storage
      .from('reports')
      .upload(fileName, buffer, { contentType: 'application/pdf', upsert: true });

    if (!storageError) {
      const { data: urlData } = supabase.storage.from('reports').getPublicUrl(fileName);
      pdfUrl = urlData?.publicUrl ?? null;
    }
  } catch {
    // PDF generation failure is non-fatal
  }

  // 5. Send emails
  let emailSent = false;
  const appUrl = cleanEnv(process.env.NEXT_PUBLIC_APP_URL) || req.nextUrl.origin;
  const fromEmail = cleanEnv(process.env.RESEND_FROM_EMAIL) || 'onboarding@zuper.co';

  try {
    const saEmail = buildSAEmail({
      orgName: session.org_name,
      customerName,
      customerEmail: session.customer_email,
      saEmail: session.sa_email,
      answers,
      changeRequests,
      sessionId: session.id,
      appUrl,
    });

    const customerEmail = buildCustomerEmail({
      orgName: session.org_name,
      customerName,
      saEmail: session.sa_email,
      changeRequests,
    });

    await Promise.all([
      resend.emails.send({
        from: fromEmail,
        to: ['dilith@zuper.co'],
        subject: saEmail.subject,
        html: saEmail.html,
        attachments: pdfUrl ? undefined : [],
      }),
      resend.emails.send({
        from: fromEmail,
        to: ['dilith@zuper.co'],
        subject: customerEmail.subject,
        html: customerEmail.html,
      }),
    ]);
    emailSent = true;
  } catch {
    // Email failure is non-fatal
  }

  // 6. Create submission record
  const selectedBrands = Array.isArray(answers['brands']) ? answers['brands'] : [];
  const selectedSuppliers = Array.isArray(answers['suppliers']) ? answers['suppliers'] : [];

  await supabase.from('submissions').insert({
    session_id: session.id,
    submitted_at: submittedAt,
    selected_brands: selectedBrands,
    selected_vendors: selectedSuppliers,
    pdf_url: pdfUrl,
    email_sent: emailSent,
  });

  // 7. Update session status
  await supabase
    .from('sessions')
    .update({ status: 'submitted', updated_at: submittedAt })
    .eq('id', session.id);

  return NextResponse.json({ ok: true });
}
