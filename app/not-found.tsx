import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAF9F7] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] flex items-center justify-center mx-auto">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 3A11 11 0 1 1 3 14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M14 9v6l3 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-orange-500 mb-2">404</p>
          <h1 className="text-[32px] font-extrabold text-[#1A1A1A] leading-tight">Page not found</h1>
          <p className="text-sm text-gray-500 leading-relaxed mt-2">
            This link may be invalid or has already been used.
          </p>
        </div>
        <div className="space-y-3">
          <Link
            href="/admin"
            className="block w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition-colors text-base flex items-center justify-center"
          >
            Go to admin →
          </Link>
          <p className="text-xs text-gray-400">
            Need help?{' '}
            <a href="mailto:onboarding@zuper.co" className="text-orange-500 underline underline-offset-2">
              onboarding@zuper.co
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
