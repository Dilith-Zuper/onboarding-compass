'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { CHANNEL_LABEL, AUDIENCE_LABEL, type DerivedNotification } from '@/lib/notifications/derive';

const CompassFlow = dynamic(
  () => import('../flowchart/CompassFlow').then((m) => ({ default: m.CompassFlow })),
  { ssr: false, loading: () => (
    <div className="w-full h-[520px] rounded-2xl border border-[#E5E2DC] bg-white flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
    </div>
  )}
);

interface ActiveNode {
  label: string;
  description: string;
  notifications: DerivedNotification[];
}

interface Props {
  answers: Record<string, any>;
  customerName: string;
  onNext: () => void;
}

export function FlowStep({ answers, customerName, onNext }: Props) {
  const [activeNode, setActiveNode] = useState<ActiveNode | null>(null);

  return (
    <div className="max-w-[760px] mx-auto px-6 py-12 space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-[11px] font-bold uppercase tracking-widest text-orange-500 mb-2">
          Your flow
        </p>
        <h1 className="text-[32px] font-extrabold text-[#1A1A1A] leading-tight">
          How your jobs will move in Zuper
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mt-2">
          Based on what you told us, {customerName}. Click any node to learn more.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.35 }}
      >
        <CompassFlow
          answers={answers}
          onNodeClick={(label, description, notifications) =>
            setActiveNode({ label, description, notifications: notifications ?? [] })
          }
        />
      </motion.div>

      {/* Node tooltip panel */}
      <AnimatePresence>
        {activeNode && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl border border-[#E5E2DC] p-5"
          >
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0 mt-0.5">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="7" cy="7" r="5.5"/>
                  <path d="M7 6v3M7 4.5v.5"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#1A1A1A]">{activeNode.label}</p>
                <p className="text-sm text-gray-500 leading-relaxed mt-0.5">{activeNode.description}</p>
              </div>
              <button
                onClick={() => setActiveNode(null)}
                className="text-gray-300 hover:text-gray-500 transition-colors shrink-0 mt-0.5"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {activeNode.notifications.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#E5E2DC]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                  Notifications that fire here · {activeNode.notifications.length}
                </p>
                <div className="space-y-2">
                  {activeNode.notifications.map((n) => (
                    <div key={n.id} className="bg-[#FAF9F7] rounded-xl border border-[#E5E2DC] px-3 py-2">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-xs font-bold text-[#1A1A1A]">{n.title}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
                          n.channel === 'sms'    ? 'bg-purple-50 text-purple-700' :
                          n.channel === 'email'  ? 'bg-blue-50 text-blue-700' :
                          n.channel === 'push'   ? 'bg-orange-50 text-orange-700' :
                          n.channel === 'in_app' ? 'bg-gray-100 text-gray-700' :
                                                   'bg-amber-50 text-amber-700'
                        }`}>
                          {CHANNEL_LABEL[n.channel]}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          → {n.audience === 'specific' ? n.audienceLabel : AUDIENCE_LABEL[n.audience]}
                        </span>
                        {n.source === 'default' && (
                          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 bg-white border border-[#E5E2DC] px-1.5 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{n.trigger}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {[
          { color: '#EFF6FF', border: '#BFDBFE', label: 'Job in Zuper' },
          { color: '#F0FDF4', border: '#BBF7D0', label: 'External system', dashed: true },
          { color: '#FFF7ED', border: '#FED7AA', label: 'Integration' },
          { color: '#FAF5FF', border: '#E9D5FF', label: 'Action / step' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className={`w-4 h-4 rounded ${item.dashed ? 'border-2 border-dashed' : 'border'}`}
              style={{ background: item.color, borderColor: item.border }}
            />
            <span className="text-xs text-gray-400">{item.label}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition-colors text-base"
      >
        Looks good — show me my account →
      </button>
    </div>
  );
}
