import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { OnboardingReport } from '@/lib/pdf/OnboardingReport';
import { buildSAEmail, buildCustomerEmail } from '@/lib/email/templates';
import { sendEmail } from '@/lib/email/sender';
import { createElement } from 'react';
import { cleanEnv } from '@/lib/utils';

const ONBOARDING_EMAIL = 'onboarding@zuper.co';

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createClient();

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

  // Upsert all responses
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

  // Finalise change requests (delete + re-insert all)
  await supabase.from('change_requests').delete().eq('session_id', session.id);
  const crRows = Object.entries(changeRequests as Record<string, string>)
    .filter(([, text]) => text?.trim())
    .map(([module, request_text]) => ({ session_id: session.id, module, request_text: request_text.trim() }));
  if (crRows.length > 0) {
    await supabase.from('change_requests').insert(crRows);
  }

  // Read latest snapshot for the report
  const { data: latestSnapshot } = await supabase
    .from('snapshots')
    .select('categories, checklists, notifications, workflows')
    .eq('session_id', session.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const appUrl = cleanEnv(process.env.NEXT_PUBLIC_APP_URL) || req.nextUrl.origin;

  // Generate PDF
  const submittedAt = new Date().toISOString();
  const wizardUrl = `${appUrl}/w/${params.token}`;
  let pdfUrl: string | null = null;
  let pdfBuffer: Buffer | null = null;

  try {
    pdfBuffer = await renderToBuffer(
      createElement(OnboardingReport, {
        orgName: session.org_name,
        customerName,
        saEmail: session.sa_email,
        customerEmail: session.customer_email,
        answers,
        changeRequests,
        submittedAt,
        snapshot: latestSnapshot ?? null,
        wizardUrl,
      }) as any
    );

    const fileName = `${session.id}/onboarding-report.pdf`;
    const { error: storageError } = await supabase.storage
      .from('reports')
      .upload(fileName, pdfBuffer, { contentType: 'application/pdf', upsert: true });

    if (!storageError) {
      const { data: urlData } = supabase.storage.from('reports').getPublicUrl(fileName);
      pdfUrl = urlData?.publicUrl ?? null;
    }
  } catch (err) {
    console.error('PDF generation failed:', err);
  }

  // Send emails
  let emailSent = false;

  const saEmailContent = buildSAEmail({
    orgName: session.org_name,
    customerName,
    customerEmail: session.customer_email,
    saEmail: session.sa_email,
    answers,
    changeRequests,
    sessionId: session.id,
    appUrl,
  });

  const customerEmailContent = buildCustomerEmail({
    orgName: session.org_name,
    customerName,
    saEmail: session.sa_email,
    changeRequests,
  });

  const pdfAttachment = pdfBuffer
    ? [{
        filename: `${session.org_name.replace(/[^A-Za-z0-9_-]+/g, '_')}-onboarding-report.pdf`,
        content: pdfBuffer.toString('base64'),
      }]
    : undefined;

  const saCc = session.sa_email && session.sa_email.toLowerCase() !== ONBOARDING_EMAIL ? [session.sa_email] : undefined;

  const [saResult, customerResult] = await Promise.all([
    sendEmail({
      to: ONBOARDING_EMAIL,
      cc: saCc,
      subject: saEmailContent.subject,
      html: saEmailContent.html,
      attachments: pdfAttachment,
    }),
    session.customer_email
      ? sendEmail({
          to: session.customer_email,
          subject: customerEmailContent.subject,
          html: customerEmailContent.html,
        })
      : Promise.resolve({ error: null }),
  ]);

  if (saResult.error || customerResult.error) {
    console.error('Email send failed — SA:', saResult.error?.message, '| Customer:', customerResult.error?.message);
  } else {
    emailSent = true;
  }

  // Create submission record
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

  await supabase
    .from('sessions')
    .update({ status: 'submitted', updated_at: submittedAt })
    .eq('id', session.id);

  return NextResponse.json({ ok: true });
}
