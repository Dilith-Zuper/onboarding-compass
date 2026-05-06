'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function RefreshSnapshotButton({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  async function handleRefresh() {
    if (!confirm('Re-fetch the Zuper snapshot? This will overwrite the cached data.')) return;
    setLoading(true);
    await fetch(`/api/zuper/${token}/snapshot?force=true`);
    setLoading(false);
    setDone(true);
    router.refresh();
    setTimeout(() => setDone(false), 3000);
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      className="h-9 px-4 border border-[#E5E2DC] text-gray-600 font-semibold rounded-full hover:bg-gray-50 disabled:opacity-50 transition-colors text-xs flex items-center gap-2"
    >
      {loading ? (
        <>
          <span className="w-3 h-3 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
          Refreshing…
        </>
      ) : done ? (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" fill="#22C55E"/>
            <path d="M3.5 6l2 2 3.5-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Refreshed
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 6A4 4 0 1 1 6 2M10 2v4H6"/>
          </svg>
          Refresh snapshot
        </>
      )}
    </button>
  );
}
