import Link from 'next/link';

export default function WizardNotFound() {
  return (
    <div className="min-h-screen bg-[#FAF9F7] flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0 text-red-500">
            <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M9 6v4M9 12v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p className="text-sm font-semibold text-red-700">Invalid or expired link</p>
        </div>
        <div>
          <h1 className="text-[28px] font-extrabold text-[#1A1A1A] leading-tight">
            This link doesn&apos;t work
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed mt-2">
            Your onboarding link may be incorrect or expired. Reach out at onboarding@zuper.co to get a new link.
          </p>
        </div>
        <p className="text-xs text-gray-400">
          Questions?{' '}
          <a href="mailto:onboarding@zuper.co" className="text-orange-500 underline underline-offset-2">
            onboarding@zuper.co
          </a>
        </p>
      </div>
    </div>
  );
}
