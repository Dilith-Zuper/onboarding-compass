'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CONFIG_MATRIX } from '@/lib/configMatrix';
import { ModuleCard } from '../modules/ModuleCard';
import { CategoriesModule } from '../modules/CategoriesModule';
import { StatusesModule } from '../modules/StatusesModule';
import { ChecklistsModule } from '../modules/ChecklistsModule';
import { NotificationsModule } from '../modules/NotificationsModule';
import { WorkflowsModule } from '../modules/WorkflowsModule';
import { CPQModule } from '../modules/CPQModule';
import type { ZuperCategory, ZuperChecklist, ZuperNotification, ZuperWorkflowSummary } from '@/lib/zuper/transformer';

interface Props {
  token: string;
  snapshot: any;
  answers: Record<string, any>;
  changeRequests: Record<string, string>;
  saEmail: string;
  isPreview: boolean;
  onChangeRequest: (module: string, text: string) => void;
  onSnapshotReady: (snapshot: any) => void;
  onNext: () => void;
}

const MODULE_ORDER = ['categories', 'statuses', 'checklists', 'notifications', 'workflows', 'cpq'] as const;

const MODULE_LABELS: Record<string, string> = {
  categories:    'Job categories',
  statuses:      'Job statuses',
  checklists:    'Checklists',
  notifications: 'Notifications',
  workflows:     'Automations',
  cpq:           'Proposals',
};

const MODULE_DESCRIPTIONS: Record<string, string> = {
  categories:    'The types of jobs your team handles in Zuper.',
  statuses:      'The stages a job moves through from start to completion.',
  checklists:    'Field checklists attached to each job type.',
  notifications: 'Automated messages sent to customers and team members.',
  workflows:     'Background automations running in your account.',
  cpq:           'Your Good / Better / Best proposal structure per brand.',
};

export function SnapshotStep({ token, snapshot, answers, changeRequests, saEmail, isPreview, onChangeRequest, onSnapshotReady, onNext }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  if (!snapshot) {
    return <SnapshotPolling token={token} onReady={onSnapshotReady} />;
  }

  const categories: ZuperCategory[]        = snapshot.categories    ?? [];
  const checklists: ZuperChecklist[]       = snapshot.checklists    ?? [];
  const notifications: ZuperNotification[] = snapshot.notifications ?? [];
  const workflows: ZuperWorkflowSummary[]  = snapshot.workflows     ?? [];
  const selectedBrands: string[]            = Array.isArray(answers['brands']) ? answers['brands'] : [];

  const moduleConfig = Object.fromEntries(CONFIG_MATRIX.map((m) => [m.module, m]));
  const total = MODULE_ORDER.length;
  const activeModule = MODULE_ORDER[activeIndex];
  const isLast = activeIndex === total - 1;

  function advance() {
    setDirection(1);
    if (isLast) {
      onNext();
    } else {
      setActiveIndex((i) => i + 1);
    }
  }

  function goBack() {
    setDirection(-1);
    setActiveIndex((i) => i - 1);
  }

  return (
    <div className="max-w-[760px] mx-auto px-6 py-12 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-[11px] font-bold uppercase tracking-widest text-orange-500 mb-2">
          Your account · {activeIndex + 1} of {total}
        </p>
        <h1 className="text-[32px] font-extrabold text-[#1A1A1A] leading-tight">
          {MODULE_LABELS[activeModule]}
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mt-2">
          {MODULE_DESCRIPTIONS[activeModule]}
        </p>
      </motion.div>

      {/* Step dots */}
      <div className="flex items-center gap-2">
        {MODULE_ORDER.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === activeIndex
                ? 'w-6 bg-orange-500'
                : i < activeIndex
                ? 'w-3 bg-orange-300'
                : 'w-3 bg-[#E5E2DC]'
            }`}
          />
        ))}
      </div>

      {/* Module content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={activeModule}
          custom={direction}
          initial={{ opacity: 0, x: direction * 32 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -32 }}
          transition={{ duration: 0.25 }}
        >
          <div className="bg-white rounded-2xl border border-[#E5E2DC] p-6">
            <ModuleCard
              config={moduleConfig[activeModule]}
              token={token}
              changeRequest={changeRequests[activeModule] || ''}
              onChangeRequest={(text) => onChangeRequest(activeModule, text)}
            >
              {activeModule === 'categories'    && <CategoriesModule    categories={categories} answers={answers} token={token} isPreview={isPreview} />}
              {activeModule === 'statuses'      && <StatusesModule      categories={categories} answers={answers} token={token} isPreview={isPreview} />}
              {activeModule === 'checklists'    && <ChecklistsModule    checklists={checklists} />}
              {activeModule === 'notifications' && <NotificationsModule notifications={notifications} answers={answers} />}
              {activeModule === 'workflows'     && <WorkflowsModule     workflows={workflows} />}
              {activeModule === 'cpq'           && <CPQModule           selectedBrands={selectedBrands} saEmail={saEmail} />}
            </ModuleCard>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        {activeIndex > 0 && (
          <button
            onClick={goBack}
            className="h-12 px-6 rounded-full border border-[#E5E2DC] text-sm font-semibold text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            ← Back
          </button>
        )}
        <button
          onClick={advance}
          className="flex-1 h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition-colors text-base"
        >
          {isLast ? 'Review and submit →' : 'Continue →'}
        </button>
      </div>
    </div>
  );
}

// ─── Snapshot polling (shown when snapshot is still being fetched) ───────────

const POLL_MESSAGES = [
  'Connecting to your Zuper account…',
  'Loading your job categories and statuses…',
  'Reading checklists for each category…',
  'Fetching notifications and automations…',
  'Almost there — translating workflows into plain English…',
];

function SnapshotPolling({ token, onReady }: { token: string; onReady: (s: any) => void }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [stalled, setStalled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();

    // Self-healing: if the fetch at session creation died, this one call
    // fetches + caches the snapshot (the endpoint is a no-op when cached).
    fetch(`/api/zuper/${token}/snapshot`).catch(() => {});

    const messageRotation = setInterval(() => {
      setMsgIndex((i) => Math.min(i + 1, POLL_MESSAGES.length - 1));
    }, 3000);

    const poll = async () => {
      try {
        const res = await fetch(`/api/customer/${token}`);
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (data?.snapshot) {
            clearInterval(messageRotation);
            onReady(data.snapshot);
            return;
          }
        }
      } catch {
        // ignore, retry on next tick
      }

      if (Date.now() - startedAt > 30_000) setStalled(true);
      if (!cancelled) setTimeout(poll, 2000);
    };

    poll();
    return () => {
      cancelled = true;
      clearInterval(messageRotation);
    };
  }, [token, onReady]);

  return (
    <div className="max-w-[760px] mx-auto px-6 py-16 text-center">
      <div className="w-10 h-10 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mx-auto mb-6" />
      <p className="text-base font-semibold text-[#1A1A1A] mb-2">{POLL_MESSAGES[msgIndex]}</p>
      <p className="text-xs text-gray-400">
        {stalled
          ? 'Still working… your account may have a lot of data. Hang tight.'
          : 'This usually takes 10–20 seconds.'}
      </p>
    </div>
  );
}
