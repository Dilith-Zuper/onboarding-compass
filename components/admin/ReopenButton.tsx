'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ReopenButton({ sessionId }: { sessionId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleReopen() {
    if (!confirm('Reopen this session? The customer will be able to edit their answers and resubmit. Their previous submission stays until they resubmit.')) return;
    setLoading(true);
    setError('');
    const res = await fetch(`/api/admin/sessions/${sessionId}/reopen`, { method: 'POST' });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'Failed to reopen');
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button
        onClick={handleReopen}
        disabled={loading}
        className="h-9 px-4 border border-[#E5E2DC] text-gray-600 font-semibold rounded-full hover:bg-gray-50 disabled:opacity-50 transition-colors text-xs flex items-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-3 h-3 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
            Reopening…
          </>
        ) : (
          'Reopen for edits'
        )}
      </button>
    </div>
  );
}
