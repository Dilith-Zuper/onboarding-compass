import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Confetti } from '@/components/shared/Confetti';

const NEXT_STEPS = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="14" height="14" rx="2"/>
        <path d="M7 8h6M7 11h4"/>
      </svg>
    ),
    title: 'Your SA reviews your setup',
    desc: (sa: string) => `${sa} will review your responses and change requests.`,
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="7"/>
        <path d="M10 6v4l2.5 2.5"/>
      </svg>
    ),
    title: 'Account configured',
    desc: () => 'Your statuses, categories, automations, and proposals are built to spec.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 3l2 4h5l-4 3 1.5 5L10 13l-4.5 2 1.5-5-4-3h5z"/>
      </svg>
    ),
    title: 'Go-live call',
    desc: () => "Your SA will schedule a walkthrough call before go-live.",
  },
];

export default async function SubmittedPage({ params }: { params: { token: string } }) {
  const supabase = createClient();

  const { data: session, error } = await supabase
    .from('sessions')
    .select('org_name, sa_email')
    .eq('unique_token', params.token)
    .single();

  if (error || !session) notFound();

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E2DC] h-16 flex items-center px-6">
        <div className="w-full max-w-[760px] mx-auto flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5A5.5 5.5 0 1 1 1.5 7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M7 4v3l1.5 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-[#E5E2DC]">|</span>
          <span className="text-sm font-medium text-gray-500">Onboarding Compass</span>
        </div>
      </header>

      <main className="max-w-[760px] mx-auto px-6 py-12 space-y-6">
        <Confetti />
        {/* Success callout */}
        <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="9" fill="#22C55E"/>
            <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-sm font-semibold text-green-700">Submitted successfully</p>
        </div>

        {/* Hero */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-orange-500 mb-2">Done</p>
          <h1 className="text-[36px] font-extrabold text-[#1A1A1A] leading-tight text-balance">
            You&apos;re all set, {session.org_name}.
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed mt-3">
            Your Zuper setup is being prepared. Here&apos;s what happens next.
          </p>
        </div>

        {/* Next steps */}
        <div className="space-y-3">
          {NEXT_STEPS.map((step, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#E5E2DC] p-5 flex items-start gap-4">
              <span className="text-orange-500 mt-0.5 shrink-0">{step.icon}</span>
              <div>
                <p className="text-sm font-bold text-[#1A1A1A]">{step.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">{step.desc(session.sa_email)}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 text-center">
          Questions?{' '}
          <a href="mailto:onboarding@zuper.co" className="text-orange-500 hover:text-orange-600 transition-colors underline underline-offset-2">
            onboarding@zuper.co
          </a>
        </p>
      </main>
    </div>
  );
}
