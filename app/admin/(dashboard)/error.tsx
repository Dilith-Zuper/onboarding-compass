'use client';

import Link from 'next/link';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-6">
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
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="h-10 px-5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition-colors text-sm"
        >
          Try again →
        </button>
        <Link
          href="/admin"
          className="h-10 px-5 border border-[#E5E2DC] text-gray-600 font-semibold rounded-full hover:bg-gray-50 transition-colors text-sm flex items-center"
        >
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
