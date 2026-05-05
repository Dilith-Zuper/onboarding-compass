'use client';

import { useState } from 'react';

interface Props {
  sessionId: string;
  orgName: string;
}

export function GoLiveButton({ sessionId, orgName }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleGenerate() {
    if (!confirm(`Generate go-live report for ${orgName}? This will fetch a fresh Zuper snapshot and send an email to support@zuper.co.`)) return;

    setState('loading');
    try {
      const res = await fetch(`/api/admin/go-live/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generatedBy: '' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setPdfUrl(data.pdfUrl);
      setState('done');
    } catch (e: any) {
      setErrorMsg(e.message || 'Something went wrong');
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" fill="#22C55E"/>
            <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-sm font-semibold text-green-700">Report generated — session is now live</span>
        </div>
        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors underline underline-offset-2"
          >
            Download PDF →
          </a>
        )}
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="flex items-center gap-3">
        <p className="text-sm text-red-600">{errorMsg}</p>
        <button
          onClick={() => setState('idle')}
          className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={state === 'loading'}
      className="h-10 px-5 bg-[#1A1A1A] hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-colors text-sm flex items-center gap-2"
    >
      {state === 'loading' ? (
        <>
          <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          Generating…
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 1v4M7 9v4M1 7h4M9 7h4"/>
            <circle cx="7" cy="7" r="2"/>
          </svg>
          Generate go-live report
        </>
      )}
    </button>
  );
}
