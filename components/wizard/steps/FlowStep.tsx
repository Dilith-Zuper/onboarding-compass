'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { CHANNEL_LABEL, AUDIENCE_LABEL, type DerivedNotification } from '@/lib/notifications/derive';
import { getStagePipeline, type StagePipeline } from '@/lib/flow/stageDetail';

const CompassFlow = dynamic(
  () => import('../flowchart/CompassFlow').then((m) => ({ default: m.CompassFlow })),
  { ssr: false, loading: () => (
    <div className="w-full h-[calc(100vh-280px)] rounded-2xl border border-[#E5E2DC] bg-white flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
    </div>
  )}
);

interface ActiveNode {
  id: string;
  label: string;
  description: string;
  notifications: DerivedNotification[];
  pipeline: StagePipeline | null;
}

interface Props {
  answers: Record<string, any>;
  customerName: string;
  snapshot: any;
  onNext: () => void;
}

export function FlowStep({ answers, customerName, snapshot, onNext }: Props) {
  const [activeNode, setActiveNode] = useState<ActiveNode | null>(null);

  return (
    <div className="max-w-[1400px] mx-auto px-6 pt-8 pb-24 space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
      >
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-orange-500 mb-1.5">
            Your flow
          </p>
          <h1 className="text-[26px] sm:text-[30px] font-extrabold text-[#1A1A1A] leading-tight">
            How your jobs will move in Zuper
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed mt-1.5">
            Based on what you told us{customerName ? `, ${customerName}` : ''}. Click any stage to see how it moves through your account, step by step — drag to rearrange, scroll to zoom.
          </p>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 shrink-0">
          {[
            { color: '#EFF6FF', border: '#BFDBFE', label: 'Job' },
            { color: '#FFF7ED', border: '#FED7AA', label: 'Integration' },
            { color: '#F0FDF4', border: '#BBF7D0', label: 'External', dashed: true },
            { color: '#FAF5FF', border: '#E9D5FF', label: 'Action' },
            { color: '#1A1A1A', border: '#1A1A1A', label: 'Start / end' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div
                className={`w-3.5 h-3.5 rounded ${item.dashed ? 'border-2 border-dashed' : 'border'}`}
                style={{ background: item.color, borderColor: item.border }}
              />
              <span className="text-[11px] text-gray-500">{item.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <CompassFlow
          answers={answers}
          onNodeClick={(id, label, description, notifications) =>
            setActiveNode({
              id,
              label,
              description,
              notifications: notifications ?? [],
              pipeline: getStagePipeline(id, snapshot?.categories, answers),
            })
          }
          className="w-full h-[calc(100vh-280px)] min-h-[520px] rounded-2xl overflow-hidden border border-[#E5E2DC] bg-white"
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

            {/* Real status pipeline for this stage, from their live account */}
            {activeNode.pipeline && (
              <div className="mt-4 pt-4 border-t border-[#E5E2DC]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                  How &ldquo;{activeNode.pipeline.categoryName}&rdquo; moves in your account · {activeNode.pipeline.statuses.length} stages
                </p>
                <div className="flex flex-wrap items-center gap-y-2">
                  {activeNode.pipeline.statuses.map((s, i) => (
                    <div key={s.uid} className="flex items-center">
                      {i > 0 && (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mx-1 text-gray-300 shrink-0">
                          <path d="M4 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      <span className="inline-flex items-center gap-1.5 bg-[#FAF9F7] border border-[#E5E2DC] rounded-full pl-2 pr-2.5 py-1">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color || '#E5E2DC' }} />
                        <span className="text-xs font-semibold text-[#1A1A1A] whitespace-nowrap">{s.name}</span>
                        {s.requireSignature && (
                          <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400 bg-white border border-[#E5E2DC] px-1 py-0.5 rounded-full">Sig</span>
                        )}
                        {s.trackTime && (
                          <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400 bg-white border border-[#E5E2DC] px-1 py-0.5 rounded-full">Timer</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lead qualification: what happens on answer / no answer */}
            {activeNode.id === 'lead_qualification' && (
              <div className="mt-4 pt-4 border-t border-[#E5E2DC] space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                  What happens on the call
                </p>
                <div className="flex items-start gap-2.5 bg-green-50/60 border border-green-100 rounded-xl px-3 py-2.5">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5 text-green-600">
                    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M4.5 7l2 2 3-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    <span className="font-bold text-[#1A1A1A]">They answer</span> — your rep runs the qualifying questions. Qualified leads move straight to booking an inspection.
                  </p>
                </div>
                <div className="flex items-start gap-2.5 bg-amber-50/60 border border-amber-100 rounded-xl px-3 py-2.5">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5 text-amber-600">
                    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M7 4v3.5l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    <span className="font-bold text-[#1A1A1A]">No answer</span> — the job is rescheduled automatically for attempts 2 and 3, with follow-up texts in between. After three misses the lead is marked cold, so nothing sits forgotten.
                  </p>
                </div>
              </div>
            )}

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

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#FAF9F7]/95 backdrop-blur border-t border-[#E5E2DC] py-3 px-6">
        <div className="max-w-[1400px] mx-auto flex justify-end">
          <button
            onClick={onNext}
            className="h-11 px-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition-colors text-sm"
          >
            Looks good — show me my account →
          </button>
        </div>
      </div>
    </div>
  );
}
