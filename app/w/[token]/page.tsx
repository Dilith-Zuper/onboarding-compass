import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import WizardShell from '@/components/wizard/WizardShell';

const CUSTOMER_NAME_KEY = '__customer_name';

export default async function WizardPage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { preview?: string };
}) {
  const supabase = createClient();
  const isPreview = searchParams?.preview === 'true';

  const { data: session, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('unique_token', params.token)
    .single();

  if (error || !session) notFound();

  // In preview mode, ignore submitted state so SAs can still inspect the wizard
  if (!isPreview && (session.status === 'submitted' || session.status === 'live')) {
    const { redirect } = await import('next/navigation');
    redirect(`/w/${params.token}/submitted`);
  }

  const { data: snapshot } = await supabase
    .from('snapshots')
    .select('*')
    .eq('session_id', session.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const { data: responses } = await supabase
    .from('responses')
    .select('question_id, answer')
    .eq('session_id', session.id);

  const { data: changeRequests } = await supabase
    .from('change_requests')
    .select('module, request_text')
    .eq('session_id', session.id);

  // Mark in_progress (skipped in preview mode). The status guard makes this
  // idempotent — a stale read can never downgrade a submitted session.
  if (!isPreview && session.status === 'pending') {
    const now = new Date().toISOString();
    await supabase
      .from('sessions')
      .update({ status: 'in_progress', updated_at: now })
      .eq('id', session.id)
      .eq('status', 'pending');
    // Funnel timestamp — separate best-effort update so a missing column
    // (pre-migration) can't block the status flip above
    await supabase
      .from('sessions')
      .update({ first_opened_at: now })
      .eq('id', session.id)
      .is('first_opened_at', null);
  }

  const initialAnswers: Record<string, any> = {};
  let initialCustomerName = '';
  for (const r of responses ?? []) {
    if (r.question_id === CUSTOMER_NAME_KEY) {
      initialCustomerName = typeof r.answer === 'string' ? r.answer : '';
    } else {
      initialAnswers[r.question_id] = r.answer;
    }
  }

  const initialChangeRequests: Record<string, string> = {};
  for (const cr of changeRequests ?? []) {
    initialChangeRequests[cr.module] = cr.request_text;
  }

  return (
    <WizardShell
      token={params.token}
      orgName={session.org_name}
      saEmail={session.sa_email}
      snapshot={snapshot}
      initialAnswers={initialAnswers}
      initialChangeRequests={initialChangeRequests}
      initialCustomerName={initialCustomerName}
      hasZuperConnect={session.has_zuper_connect ?? false}
      isPreview={isPreview}
    />
  );
}
