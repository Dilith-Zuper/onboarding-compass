'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { QUESTIONS, computeWidgetMode } from '@/lib/questions';
import { CONFIG_MATRIX } from '@/lib/configMatrix';
interface Props {
  token: string;
  orgName: string;
  customerName: string;
  saEmail: string;
  answers: Record<string, any>;
  changeRequests: Record<string, string>;
  isPreview: boolean;
}

export function ReviewStep({ token, orgName, customerName, saEmail, answers, changeRequests, isPreview }: Props) {
  const contactEmail = saEmail || 'onboarding@zuper.co';
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Build human-readable Q&A list
  const answeredQA = QUESTIONS
    .filter((q) => answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== '')
    .map((q) => {
      const raw = answers[q.id];
      let display: string;
      if (Array.isArray(raw)) {
        const optLabels = (q.options ?? []).reduce<Record<string, string>>((acc, o) => {
          acc[o.value] = o.label; return acc;
        }, {});
        display = raw.filter((v) => v !== 'other').map((v) => optLabels[v] || v).join(', ');
        if (raw.includes('other')) display += display ? ', + other' : 'Other';
      } else if (q.options) {
        display = q.options.find((o) => o.value === raw)?.label || String(raw);
      } else {
        display = String(raw);
      }
      return { question: q.text, answer: display };
    });

  const activeRequests = CONFIG_MATRIX.filter((m) => changeRequests[m.module]?.trim());

  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/customer/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName, answers, changeRequests }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }
      router.push(`/w/${token}/submitted`);
    } catch {
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[760px] mx-auto px-6 py-12 space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-[11px] font-bold uppercase tracking-widest text-orange-500 mb-2">
          Final step
        </p>
        <h1 className="text-[32px] font-extrabold text-[#1A1A1A] leading-tight">
          Review &amp; submit
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mt-2">
          Check everything looks right, then submit to {contactEmail}.
        </p>
      </motion.div>

      {/* Answers summary */}
      {answeredQA.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E5E2DC] overflow-hidden">
          <div className="px-5 py-4 bg-[#F5F3F0] border-b border-[#E5E2DC]">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
              Your answers · {answeredQA.length}
            </p>
          </div>
          <div className="divide-y divide-[#E5E2DC]">
            {answeredQA.map((qa, i) => (
              <div key={i} className="px-5 py-3 flex flex-col sm:flex-row sm:gap-4 sm:items-start gap-1">
                <p className="text-xs text-gray-400 sm:flex-1 leading-relaxed">{qa.question}</p>
                <p className="text-sm font-semibold text-[#1A1A1A] sm:text-right sm:max-w-[240px] leading-snug">{qa.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Widget mode callout */}
      {(() => {
        const widget = computeWidgetMode(answers);
        if (!widget) return null;
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 flex items-start gap-3">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0 mt-0.5 text-blue-600">
              <rect x="2" y="3" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M5 7h8M5 10h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <div>
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-0.5">Booking widget</p>
              <p className="text-sm font-semibold text-blue-900">{widget.mode}</p>
              <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">{widget.description}</p>
            </div>
          </div>
        );
      })()}

      {/* Change requests */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">
          Change requests · {activeRequests.length}
        </p>
        {activeRequests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5E2DC] px-5 py-4">
            <p className="text-sm text-gray-400">No change requests — defaults will be configured as standard.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeRequests.map((m) => (
              <div key={m.module} className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">{m.label}</p>
                <p className="text-sm text-[#1A1A1A] leading-relaxed">{changeRequests[m.module]}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Terms */}
      <div className="bg-[#F5F3F0] rounded-2xl px-5 py-4">
        <p className="text-xs text-gray-500 leading-relaxed">
          By submitting, you confirm these are your requirements for the {orgName} Zuper setup.
          If anything changes after submission, email{' '}
          <a href={`mailto:${contactEmail}`} className="text-orange-500 underline underline-offset-2">
            {contactEmail}
          </a>
          {saEmail && (
            <>
              {' '}or{' '}
              <a href="mailto:onboarding@zuper.co" className="text-orange-500 underline underline-offset-2">
                onboarding@zuper.co
              </a>
            </>
          )}
          .
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {isPreview ? (
        <div className="space-y-2">
          <button
            disabled
            className="w-full h-12 bg-gray-200 text-gray-400 cursor-not-allowed font-semibold rounded-full text-base"
          >
            Submit disabled in preview
          </button>
          <p className="text-center text-xs text-gray-400">
            You&apos;re viewing this in preview mode. Close the tab when done.
          </p>
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-12 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-colors text-base flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Submitting…
            </>
          ) : 'Submit to my SA →'}
        </button>
      )}
    </div>
  );
}
