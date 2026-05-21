'use client';

import { useState } from 'react';

export function SendInviteButton({ sessionId }: { sessionId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');

  async function handleSend() {
    setState('loading');
    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}/send-invite`, { method: 'POST' });
      setState(res.ok ? 'sent' : 'error');
    } catch {
      setState('error');
    }
  }

  if (state === 'sent') {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Invite sent
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {state === 'error' && (
        <span className="text-xs text-red-500">Failed to send — try again</span>
      )}
      <button
        onClick={handleSend}
        disabled={state === 'loading'}
        className="flex items-center gap-2 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors disabled:opacity-50"
      >
        {state === 'loading' ? (
          <>
            <span className="inline-block w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent animate-spin rounded-full" />
            Sending…
          </>
        ) : (
          <>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M1.5 7.5L13.5 2L9 13L7.5 8.5L1.5 7.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Send invite email
          </>
        )}
      </button>
    </div>
  );
}
