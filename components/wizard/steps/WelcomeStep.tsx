'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface WelcomeStepProps {
  orgName: string;
  onNext: (customerName: string) => void;
}

const HIGHLIGHTS = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 2C5.134 2 2 5.134 2 9s3.134 7 7 7 7-3.134 7-7-3.134-7-7-7z"/>
        <path d="M9 5v4l3 3"/>
      </svg>
    ),
    text: 'See your exact Zuper workflow mapped to how you run jobs',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="14" height="12" rx="2"/>
        <path d="M6 7h6M6 10h4"/>
      </svg>
    ),
    text: 'Review your live account — categories, statuses, automations',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2l3 3-9 9H4v-3L13 2z"/>
      </svg>
    ),
    text: 'Request changes or customisations inline',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 2v4M9 12v4M2 9h4M12 9h4"/>
        <circle cx="9" cy="9" r="3"/>
      </svg>
    ),
    text: 'Submit everything — your account gets configured before go-live',
  },
];

export function WelcomeStep({ orgName, onNext }: WelcomeStepProps) {
  const [name, setName] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim()) onNext(name.trim());
  }

  return (
    <div className="max-w-[760px] mx-auto px-6 py-12 space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-[11px] font-bold uppercase tracking-widest text-orange-500 mb-2">
          Welcome
        </p>
        <h1 className="text-[36px] font-extrabold text-[#1A1A1A] leading-tight text-balance">
          {orgName}&apos;s Zuper setup
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mt-3">
          This takes about 10 minutes. Here&apos;s what we&apos;ll cover:
        </p>
      </motion.div>

      <div className="space-y-3">
        {HIGHLIGHTS.map((h, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * i + 0.2, duration: 0.3 }}
            className="bg-white rounded-2xl border border-[#E5E2DC] p-5 flex items-start gap-4"
          >
            <span className="text-orange-500 mt-0.5 shrink-0">{h.icon}</span>
            <p className="text-sm text-gray-500 leading-relaxed">{h.text}</p>
          </motion.div>
        ))}
      </div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65, duration: 0.3 }}
        className="space-y-4"
      >
        <div className="bg-white rounded-2xl border border-[#E5E2DC] px-5 py-4 space-y-1 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Your first name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. John"
            autoFocus
            className="w-full text-[#1A1A1A] text-base placeholder-gray-300 focus:outline-none bg-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full h-12 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-colors text-base"
        >
          Let&apos;s go →
        </button>
      </motion.form>
    </div>
  );
}
