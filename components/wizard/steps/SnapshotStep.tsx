'use client';

import { useState } from 'react';
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
  onChangeRequest: (module: string, text: string) => void;
  onNext: () => void;
}

const TAB_ORDER = ['categories', 'statuses', 'checklists', 'notifications', 'workflows', 'cpq'];

const TAB_LABELS: Record<string, string> = {
  categories:    'Categories',
  statuses:      'Statuses',
  checklists:    'Checklists',
  notifications: 'Notifications',
  workflows:     'Automations',
  cpq:           'Proposals',
};

export function SnapshotStep({ token, snapshot, answers, changeRequests, saEmail, onChangeRequest, onNext }: Props) {
  const [activeTab, setActiveTab] = useState('categories');

  if (!snapshot) {
    return (
      <div className="max-w-[760px] mx-auto px-6 py-12 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">Fetching your account data…</p>
      </div>
    );
  }

  const categories: ZuperCategory[]       = snapshot.categories    ?? [];
  const checklists: ZuperChecklist[]      = snapshot.checklists    ?? [];
  const notifications: ZuperNotification[]= snapshot.notifications ?? [];
  const workflows: ZuperWorkflowSummary[] = snapshot.workflows     ?? [];
  const explanations                       = snapshot.workflow_explanations ?? {};
  const selectedBrands: string[]           = Array.isArray(answers['brands']) ? answers['brands'] : [];

  const counts: Record<string, number> = {
    categories:    categories.length,
    statuses:      categories.reduce((sum, c) => sum + c.statuses.length, 0),
    checklists:    checklists.filter((c) => c.items.length > 0).length,
    notifications: notifications.length,
    workflows:     workflows.length,
    cpq:           selectedBrands.filter((b) => b !== 'other').length,
  };

  const moduleConfig = Object.fromEntries(CONFIG_MATRIX.map((m) => [m.module, m]));

  return (
    <div className="max-w-[760px] mx-auto px-6 py-12 space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-[11px] font-bold uppercase tracking-widest text-orange-500 mb-2">
          Your account
        </p>
        <h1 className="text-[32px] font-extrabold text-[#1A1A1A] leading-tight">
          Here&apos;s how your account is set up
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mt-2">
          This is your live Zuper configuration. Review each section and request changes below.
        </p>
      </motion.div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-[#F5F3F0] rounded-xl p-1 overflow-x-auto">
        {TAB_ORDER.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {TAB_LABELS[tab]}
            {counts[tab] > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab ? 'bg-orange-50 text-orange-600' : 'bg-gray-200 text-gray-500'
              }`}>
                {counts[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Module content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <div className="bg-white rounded-2xl border border-[#E5E2DC] p-6">
            <h2 className="text-[17px] font-extrabold text-[#1A1A1A] leading-snug mb-5">
              {TAB_LABELS[activeTab]}
            </h2>

            <ModuleCard
              config={moduleConfig[activeTab]}
              token={token}
              changeRequest={changeRequests[activeTab] || ''}
              onChangeRequest={(text) => onChangeRequest(activeTab, text)}
            >
              {activeTab === 'categories'    && <CategoriesModule    categories={categories} />}
              {activeTab === 'statuses'      && <StatusesModule      categories={categories} />}
              {activeTab === 'checklists'    && <ChecklistsModule    checklists={checklists} />}
              {activeTab === 'notifications' && <NotificationsModule notifications={notifications} answers={answers} />}
              {activeTab === 'workflows'     && <WorkflowsModule     workflows={workflows} explanations={explanations} token={token} />}
              {activeTab === 'cpq'           && <CPQModule           selectedBrands={selectedBrands} saEmail={saEmail} />}
            </ModuleCard>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress hint */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        {TAB_ORDER.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`w-2 h-2 rounded-full transition-all ${
              tab === activeTab ? 'bg-orange-500 w-4' : 'bg-[#E5E2DC] hover:bg-gray-300'
            }`}
          />
        ))}
        <span className="ml-1">
          {TAB_ORDER.indexOf(activeTab) + 1} of {TAB_ORDER.length}
        </span>
      </div>

      <button
        onClick={onNext}
        className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition-colors text-base"
      >
        Review and submit →
      </button>
    </div>
  );
}
