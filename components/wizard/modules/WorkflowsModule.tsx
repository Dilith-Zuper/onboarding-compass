'use client';

import { useState, useEffect } from 'react';
import type { ZuperWorkflowSummary } from '@/lib/zuper/transformer';

type Explanation = { headline: string; description: string; saves: string[] };

interface Props {
  workflows: ZuperWorkflowSummary[];
  explanations: Record<string, Explanation>;
  token: string;
}

export function WorkflowsModule({ workflows, explanations: initialExplanations, token }: Props) {
  const [explanations, setExplanations] = useState<Record<string, Explanation>>(initialExplanations);

  // Poll for missing explanations every 3s until all arrive or 45s passes
  useEffect(() => {
    const missing = workflows.filter((w) => !explanations[w.uid]).length;
    if (!missing || !token) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/zuper/${token}/workflows`);
        if (res.ok) {
          const data = await res.json();
          setExplanations(data.explanations ?? {});
        }
      } catch { /* non-fatal */ }
    }, 3000);

    const timeout = setTimeout(() => clearInterval(interval), 45_000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  // Run only on mount — polling manages itself via the interval
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!workflows.length) {
    return <p className="text-sm text-gray-500">No automations found.</p>;
  }

  const active   = workflows.filter((w) => w.isActive);
  const inactive = workflows.filter((w) => !w.isActive);
  const readyCount = workflows.filter((w) => explanations[w.uid]).length;
  const totalCount = workflows.length;

  return (
    <div className="space-y-3">
      {/* Progress indicator while explanations are loading */}
      {readyCount < totalCount && (
        <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-xl">
          <span className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin shrink-0" />
          <p className="text-xs text-orange-700 font-medium">
            Generating plain-English explanations… {readyCount}/{totalCount} ready
          </p>
        </div>
      )}

      {active.map((wf)   => <WorkflowCard key={wf.uid} wf={wf} explanation={explanations[wf.uid]} />)}
      {inactive.map((wf) => <WorkflowCard key={wf.uid} wf={wf} explanation={explanations[wf.uid]} dim />)}
    </div>
  );
}

function WorkflowCard({
  wf,
  explanation,
  dim,
}: {
  wf: ZuperWorkflowSummary;
  explanation?: Explanation;
  dim?: boolean;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-[#E5E2DC] p-5 ${dim ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <p className="text-sm font-bold text-[#1A1A1A]">
            {explanation?.headline || wf.name}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Trigger: {wf.trigger} · {wf.nodeCount} node{wf.nodeCount !== 1 ? 's' : ''}
          </p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
          wf.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
        }`}>
          {wf.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {explanation ? (
        <>
          <p className="text-sm text-gray-500 leading-relaxed mb-3">{explanation.description}</p>
          {explanation.saves.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Saves you from</p>
              {explanation.saves.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5 text-orange-500">
                    <circle cx="7" cy="7" r="6" fill="currentColor" opacity="0.15"/>
                    <path d="M4 7l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p className="text-xs text-gray-500">{s}</p>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border-2 border-orange-400 border-t-transparent animate-spin shrink-0" />
          <p className="text-xs text-gray-400">Generating explanation…</p>
        </div>
      )}
    </div>
  );
}
