'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getVisibleQuestions, Question } from '@/lib/questions';
import { showToast } from '../gamification/MilestoneToast';

const PAGE_SIZE = 6;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

interface Props {
  customerName: string;
  answers: Record<string, any>;
  onAnswerChange: (a: Record<string, any>) => void;
  onNext: (a: Record<string, any>) => void;
}

export function QuestionsStep({ customerName, answers, onAnswerChange, onNext }: Props) {
  const [localAnswers, setLocalAnswers] = useState<Record<string, any>>(answers);
  const [pageIndex, setPageIndex] = useState(0);
  const [otherText, setOtherText] = useState<Record<string, string>>({});

  const visible = getVisibleQuestions(localAnswers);
  const pages = chunk(visible, PAGE_SIZE);
  const currentPage = pages[pageIndex] ?? [];
  const isLastPage = pageIndex >= pages.length - 1;

  function setAnswer(id: string, value: any) {
    const next = { ...localAnswers, [id]: value };
    setLocalAnswers(next);
    onAnswerChange(next);
    if (id === 'brands' && Array.isArray(value) && value.length > 0) {
      showToast('Good. We will build your proposals for each brand.');
    }
  }

  const pageComplete = currentPage.every((q) => {
    if (!q.required) return true;
    const a = localAnswers[q.id];
    if (a === undefined || a === null || a === '') return false;
    if (Array.isArray(a) && a.length === 0) return false;
    return true;
  });

  function handleContinue() {
    if (!pageComplete) return;
    if (isLastPage) {
      onNext(localAnswers);
    } else {
      setPageIndex((p) => p + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return (
    <div className="max-w-[760px] mx-auto px-6 py-12 space-y-8">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-orange-500 mb-2">
          Questions · {pageIndex + 1} of {pages.length}
        </p>
        <h1 className="text-[32px] font-extrabold text-[#1A1A1A] leading-tight">
          How do you run your business?
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mt-2">
          Hi {customerName} — these answers shape your personalised Zuper workflow.
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={pageIndex}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          {currentPage.map((q) => (
            <QuestionField
              key={q.id}
              question={q}
              value={localAnswers[q.id]}
              otherValue={otherText[q.id] || ''}
              onOtherChange={(v) => setOtherText((prev) => ({ ...prev, [q.id]: v }))}
              onChange={(val) => setAnswer(q.id, val)}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-3 pt-2">
        {pageIndex > 0 && (
          <button
            onClick={() => { setPageIndex((p) => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
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
  question, value, otherValue, onOtherChange, onChange,
}: {
  question: Question;
  value: any;
  otherValue: string;
  onOtherChange: (v: string) => void;
  onChange: (v: any) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[17px] font-extrabold text-[#1A1A1A] leading-snug">{question.text}</p>
        {question.subtext && (
          <p className="text-sm text-gray-500 leading-relaxed mt-1">{question.subtext}</p>
        )}
      </div>

      {question.type === 'single_select' && (
        <div className="space-y-2">
          {question.options?.map((opt) => {
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

      {question.type === 'multi_select' && (
        <div className="space-y-2">
          {question.options?.map((opt) => {
            const current: string[] = Array.isArray(value) ? value : [];
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
        </div>
      )}

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
          options={question.options ?? []}
          value={Array.isArray(value) ? value : []}
          otherValue={otherValue}
          onOtherChange={onOtherChange}
          hasOther={question.otherOption}
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
