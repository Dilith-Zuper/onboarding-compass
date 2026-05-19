'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getQuestionsBySection,
  getEffectiveSubtext,
  getEffectiveOptions,
  Question,
  Section,
} from '@/lib/questions';
import { showToast } from '../gamification/MilestoneToast';
import { FileUploadField } from './FileUploadField';

const PAGE_SIZE = 6;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

interface Page {
  section: Section;
  questions: Question[];
  /** 1-based: which page of its section this is (e.g. 2 of 3) */
  sectionPageIndex: number;
  sectionPageCount: number;
}

interface Props {
  token: string;
  customerName: string;
  answers: Record<string, any>;
  onAnswerChange: (a: Record<string, any>) => void;
  onNext: (a: Record<string, any>) => void;
  hasZuperConnect: boolean;
  isPreview: boolean;
}

type SaveStatus = 'idle' | 'saving' | 'saved';

export function QuestionsStep({
  token,
  customerName,
  answers,
  onAnswerChange,
  onNext,
  hasZuperConnect,
  isPreview,
}: Props) {
  const [localAnswers, setLocalAnswers] = useState<Record<string, any>>(answers);
  const [pageIndex, setPageIndex] = useState(0);
  const [otherText, setOtherText] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear pending timers on unmount
  useEffect(() => {
    return () => {
      Object.values(saveTimers.current).forEach(clearTimeout);
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  function persistAnswer(questionId: string, value: any) {
    if (isPreview) return;
    // Debounce per-question: cancel previous pending save for this question
    if (saveTimers.current[questionId]) clearTimeout(saveTimers.current[questionId]);
    setSaveStatus('saving');
    saveTimers.current[questionId] = setTimeout(async () => {
      try {
        await fetch(`/api/customer/${token}/response`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question_id: questionId, answer: value }),
        });
        setSaveStatus('saved');
        if (savedTimer.current) clearTimeout(savedTimer.current);
        savedTimer.current = setTimeout(() => setSaveStatus('idle'), 1500);
      } catch {
        // Silent failure — the customer can re-trigger save on the next change
        setSaveStatus('idle');
      } finally {
        delete saveTimers.current[questionId];
      }
    }, 500);
  }

  const sessionFlags = { hasZuperConnect };

  // Build pages: each page contains questions from a single section (up to PAGE_SIZE).
  // Recomputed each render so newly-visible conditional questions appear.
  const pages: Page[] = useMemo(() => {
    const grouped = getQuestionsBySection(localAnswers, sessionFlags);
    const out: Page[] = [];
    for (const { section, questions } of grouped) {
      const chunks = chunk(questions, PAGE_SIZE);
      chunks.forEach((qs, i) => {
        out.push({
          section,
          questions: qs,
          sectionPageIndex: i + 1,
          sectionPageCount: chunks.length,
        });
      });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localAnswers, hasZuperConnect]);

  // Clamp pageIndex if pages shrink (e.g. conditional question disappears)
  const safePageIndex = Math.min(pageIndex, Math.max(0, pages.length - 1));
  const currentPage = pages[safePageIndex];
  const isLastPage = safePageIndex >= pages.length - 1;

  function setAnswer(id: string, value: any) {
    const next = { ...localAnswers, [id]: value };
    setLocalAnswers(next);
    onAnswerChange(next);
    persistAnswer(id, value);
    if (id === 'brands' && Array.isArray(value) && value.length > 0) {
      showToast('Good. We will build your proposals for each brand.');
    }
  }

  function isQuestionAnswered(q: Question): boolean {
    const a = localAnswers[q.id];
    if (a === undefined || a === null || a === '') return false;
    if (Array.isArray(a) && a.length === 0) return false;
    if (q.type === 'file_upload' && (!a || typeof a !== 'object' || !a.url)) return false;
    return true;
  }

  const missingRequired = (currentPage?.questions ?? []).filter(
    (q) => q.required && !isQuestionAnswered(q)
  );
  const pageComplete = missingRequired.length === 0;

  function handleContinue() {
    if (!pageComplete) return;
    if (isLastPage) {
      onNext(localAnswers);
    } else {
      // Detect section transition for milestone toast
      const next = pages[safePageIndex + 1];
      if (next && next.section.id !== currentPage.section.id) {
        showToast(`Next up: ${next.section.label}.`);
      }
      setPageIndex(safePageIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  if (!currentPage) {
    return (
      <div className="max-w-[760px] mx-auto px-6 py-12">
        <p className="text-sm text-gray-500">Loading questions…</p>
      </div>
    );
  }

  return (
    <div className="max-w-[760px] mx-auto px-6 py-12 space-y-8">
      {/* Section header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-orange-500 mb-2">
            {currentPage.section.label}
            {currentPage.sectionPageCount > 1 && (
              <span className="text-gray-400 font-semibold"> · {currentPage.sectionPageIndex} of {currentPage.sectionPageCount}</span>
            )}
            <span className="text-gray-400 font-semibold"> · Step {safePageIndex + 1} of {pages.length}</span>
          </p>
          <h1 className="text-[28px] sm:text-[32px] font-extrabold text-[#1A1A1A] leading-tight">
            {customerName ? `Hi ${customerName} — ` : ''}{currentPage.section.description}
          </h1>
        </div>

        {/* Save indicator */}
        {!isPreview && saveStatus !== 'idle' && (
          <div className="shrink-0 flex items-center gap-1.5 text-xs text-gray-400 mt-2">
            {saveStatus === 'saving' ? (
              <>
                <span className="w-3 h-3 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
                <span>Saving…</span>
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-green-600">
                  <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Saved</span>
              </>
            )}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={safePageIndex}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          {currentPage.questions.map((q) => (
            <QuestionField
              key={q.id}
              token={token}
              question={q}
              subtext={getEffectiveSubtext(q, localAnswers)}
              effectiveOptions={getEffectiveOptions(q, localAnswers)}
              value={localAnswers[q.id]}
              otherValue={otherText[q.id] || ''}
              onOtherChange={(v) => setOtherText((prev) => ({ ...prev, [q.id]: v }))}
              onChange={(val) => setAnswer(q.id, val)}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {!pageComplete && missingRequired.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1.5">
            Still needed — {missingRequired.length} question{missingRequired.length === 1 ? '' : 's'}
          </p>
          <ul className="space-y-1">
            {missingRequired.map((q) => (
              <li key={q.id} className="text-sm text-amber-800 leading-snug flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{q.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        {safePageIndex > 0 && (
          <button
            onClick={() => {
              setPageIndex(safePageIndex - 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex-1 h-12 border border-[#E5E2DC] text-gray-600 font-semibold rounded-full hover:bg-gray-50 transition-colors text-base"
          >
            ← Back
          </button>
        )}
        <button
          onClick={handleContinue}
          disabled={!pageComplete}
          className="flex-1 h-12 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-colors text-base"
        >
          {isLastPage ? 'See my flow →' : 'Continue →'}
        </button>
      </div>
    </div>
  );
}

// ─── Question Field ──────────────────────────────────────────────────────────

function QuestionField({
  token,
  question,
  subtext,
  effectiveOptions,
  value,
  otherValue,
  onOtherChange,
  onChange,
}: {
  token: string;
  question: Question;
  subtext?: string;
  effectiveOptions: { value: string; label: string }[];
  value: any;
  otherValue: string;
  onOtherChange: (v: string) => void;
  onChange: (v: any) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[17px] font-extrabold text-[#1A1A1A] leading-snug">{question.text}</p>
        {subtext && (
          <p className="text-sm text-gray-500 leading-relaxed mt-1 whitespace-pre-line">{subtext}</p>
        )}
      </div>

      {question.type === 'single_select' && (
        <div className="space-y-2">
          {effectiveOptions.map((opt) => {
            const sel = value === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onChange(opt.value)}
                className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all ${
                  sel ? 'border-orange-400 bg-orange-50' : 'border-[#E5E2DC] bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-sm font-semibold ${sel ? 'text-orange-700' : 'text-[#1A1A1A]'}`}>
                    {opt.label}
                  </span>
                  {sel && (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
                      <circle cx="9" cy="9" r="8" fill="#F97316"/>
                      <path d="M5.5 9l2.5 2.5 4.5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {question.type === 'multi_select' && (() => {
        const current: string[] = Array.isArray(value) ? value : [];
        const otherSelected = current.includes('other');
        return (
          <div className="space-y-2">
            {effectiveOptions.map((opt) => {
              const sel = current.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => onChange(sel ? current.filter((v) => v !== opt.value) : [...current, opt.value])}
                  className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all ${
                    sel ? 'border-orange-400 bg-orange-50' : 'border-[#E5E2DC] bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-sm font-semibold ${sel ? 'text-orange-700' : 'text-[#1A1A1A]'}`}>
                      {opt.label}
                    </span>
                    {sel && (
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
                        <circle cx="9" cy="9" r="8" fill="#F97316"/>
                        <path d="M5.5 9l2.5 2.5 4.5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
            {question.otherOption && (
              <button
                onClick={() => onChange(otherSelected ? current.filter((v) => v !== 'other') : [...current, 'other'])}
                className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all ${
                  otherSelected ? 'border-orange-400 bg-orange-50' : 'border-[#E5E2DC] bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-sm font-semibold ${otherSelected ? 'text-orange-700' : 'text-[#1A1A1A]'}`}>
                    Other
                  </span>
                  {otherSelected && (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
                      <circle cx="9" cy="9" r="8" fill="#F97316"/>
                      <path d="M5.5 9l2.5 2.5 4.5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </button>
            )}
            {question.otherOption && otherSelected && (
              <div className="bg-white rounded-2xl border border-[#E5E2DC] px-5 py-4 space-y-1 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Please specify
                </label>
                <input
                  type="text"
                  value={otherValue}
                  onChange={(e) => onOtherChange(e.target.value)}
                  placeholder="Type here…"
                  autoFocus
                  className="w-full text-[#1A1A1A] text-base placeholder-gray-300 focus:outline-none bg-transparent"
                />
              </div>
            )}
          </div>
        );
      })()}

      {question.type === 'single_line' && (
        <div className="bg-white rounded-2xl border border-[#E5E2DC] px-5 py-4 space-y-1 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Your answer
          </label>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type here…"
            className="w-full text-[#1A1A1A] text-base placeholder-gray-300 focus:outline-none bg-transparent"
          />
        </div>
      )}

      {question.type === 'multi_line' && (
        <div className="bg-white rounded-2xl border border-[#E5E2DC] px-5 py-4 space-y-1 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Your answer
          </label>
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type here…"
            rows={3}
            className="w-full text-[#1A1A1A] text-base placeholder-gray-300 focus:outline-none bg-transparent resize-none"
          />
        </div>
      )}

      {question.type === 'card_select' && (
        <CardSelect
          options={effectiveOptions}
          value={Array.isArray(value) ? value : []}
          otherValue={otherValue}
          onOtherChange={onOtherChange}
          hasOther={question.otherOption}
          onChange={onChange}
        />
      )}

      {question.type === 'file_upload' && (
        <FileUploadField
          token={token}
          questionId={question.id}
          value={value}
          onChange={onChange}
        />
      )}
    </div>
  );
}

// ─── Card Select ─────────────────────────────────────────────────────────────

function CardSelect({
  options, value, otherValue, onOtherChange, hasOther, onChange,
}: {
  options: { value: string; label: string }[];
  value: string[];
  otherValue: string;
  onOtherChange: (v: string) => void;
  hasOther?: boolean;
  onChange: (v: string[]) => void;
}) {
  const otherSelected = value.includes('other');

  function toggle(v: string) {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map((opt) => {
          const sel = value.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                sel
                  ? 'border-orange-400 bg-orange-50 text-orange-700'
                  : 'border-[#E5E2DC] bg-white text-[#1A1A1A] hover:border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
        {hasOther && (
          <button
            onClick={() => toggle('other')}
            className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
              otherSelected
                ? 'border-orange-400 bg-orange-50 text-orange-700'
                : 'border-[#E5E2DC] bg-white text-[#1A1A1A] hover:border-gray-300'
            }`}
          >
            Other
          </button>
        )}
      </div>

      {otherSelected && (
        <div className="bg-white rounded-2xl border border-[#E5E2DC] px-5 py-4 space-y-1 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Please specify
          </label>
          <input
            type="text"
            value={otherValue}
            onChange={(e) => onOtherChange(e.target.value)}
            placeholder="Type here…"
            autoFocus
            className="w-full text-[#1A1A1A] text-base placeholder-gray-300 focus:outline-none bg-transparent"
          />
        </div>
      )}

      {value.length > 0 && (
        <p className="text-xs text-gray-400">
          {value.filter((v) => v !== 'other').length + (otherSelected && otherValue ? 1 : 0)} selected
        </p>
      )}
    </div>
  );
}
