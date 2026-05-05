'use client';

export default function WizardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#FAF9F7] flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0 mt-0.5 text-red-500">
            <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M9 6v4M9 12v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <div>
            <p className="text-sm font-semibold text-red-700">Something went wrong</p>
            <p className="text-xs text-red-600 mt-0.5">{error.message}</p>
          </div>
        </div>
        <div>
          <h1 className="text-[28px] font-extrabold text-[#1A1A1A] leading-tight">
            An error occurred
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed mt-2">
            Something unexpected happened loading your onboarding wizard. Try again or contact your SA.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition-colors text-sm"
          >
            Try again →
          </button>
          <a
            href="mailto:onboarding@zuper.co"
            className="flex-1 h-11 border border-[#E5E2DC] text-gray-600 font-semibold rounded-full hover:bg-gray-50 transition-colors text-sm flex items-center justify-center"
          >
            Contact support
          </a>
        </div>
      </div>
    </div>
  );
}
