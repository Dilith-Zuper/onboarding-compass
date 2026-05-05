import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import WizardShell from '@/components/wizard/WizardShell';

export default async function WizardPage({ params }: { params: { token: string } }) {
  const supabase = createClient();

  const { data: session, error } = await supabase
    .from('sessions')
    .select('id, org_name, customer_email, sa_email, status, unique_token')
    .eq('unique_token', params.token)
    .single();

  if (error || !session) notFound();

  if (session.status === 'submitted' || session.status === 'live') {
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

  // Mark in_progress
  if (session.status === 'pending') {
    await supabase
      .from('sessions')
      .update({ status: 'in_progress', updated_at: new Date().toISOString() })
      .eq('id', session.id);
  }

  const initialAnswers: Record<string, any> = {};
  for (const r of responses ?? []) {
    initialAnswers[r.question_id] = r.answer;
  }

  const initialChangeRequests: Record<string, string> = {};
  for (const cr of changeRequests ?? []) {
    initialChangeRequests[cr.module] = cr.request_text;
  }

  return (
    <WizardShell
      token={params.token}
      orgName={session.org_name}
      snapshot={snapshot}
      initialAnswers={initialAnswers}
      initialChangeRequests={initialChangeRequests}
    />
  );
}
