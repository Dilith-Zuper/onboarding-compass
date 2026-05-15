'use client';

import { useState } from 'react';
import type { ZuperNotification } from '@/lib/zuper/transformer';
import {
  deriveNotificationsFromAnswers,
  getAlwaysOnNotifications,
  CHANNEL_LABEL,
  AUDIENCE_LABEL,
  type DerivedNotification,
} from '@/lib/notifications/derive';

interface Props {
  notifications: ZuperNotification[];
  answers: Record<string, any>;
}

type TabId = 'live' | 'from_answers' | 'defaults';

export function NotificationsModule({ notifications, answers }: Props) {
  const derived = deriveNotificationsFromAnswers(answers);
  const defaults = getAlwaysOnNotifications(answers);
  const live = notifications;

  const TABS: { id: TabId; label: string; count: number; description: string }[] = [
    {
      id: 'live',
      label: 'Live in your account',
      count: live.length,
      description: 'Customer notifications currently configured in your Zuper account.',
    },
    {
      id: 'from_answers',
      label: 'From your answers',
      count: derived.length,
      description: 'Notifications we\'ll set up based on what you told us in this wizard.',
    },
    {
      id: 'defaults',
      label: 'Always-on defaults',
      count: defaults.length,
      description: 'Notifications that fire by default on every Zuper account — no configuration needed.',
    },
  ];

  const [tab, setTab] = useState<TabId>(live.length > 0 ? 'live' : derived.length > 0 ? 'from_answers' : 'defaults');
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-[#FAF9F7] border border-[#E5E2DC] rounded-xl p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
              tab === t.id
                ? 'bg-white text-[#1A1A1A] border border-[#E5E2DC] shadow-sm'
                : 'text-gray-500 hover:text-[#1A1A1A]'
            }`}
          >
            <span className="block">{t.label}</span>
            <span className={`text-[10px] font-bold ${tab === t.id ? 'text-orange-500' : 'text-gray-400'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 leading-relaxed">{active.description}</p>

      {/* Content */}
      {tab === 'live' && <LiveTab notifications={live} />}
      {tab === 'from_answers' && <DerivedTab items={derived} emptyText="No notifications derived from your answers — they'll appear here as you fill in payments, reminders, and closeout questions." />}
      {tab === 'defaults' && <DerivedTab items={defaults} emptyText="No default notifications applicable to your flow." />}
    </div>
  );
}

// ─── Live tab (from Zuper API) ────────────────────────────────────────────────

function LiveTab({ notifications }: { notifications: ZuperNotification[] }) {
  if (!notifications.length) {
    return <p className="text-sm text-gray-400">No notifications configured yet in this account.</p>;
  }

  const activeItems   = notifications.filter((n) => n.isActive);
  const inactiveItems = notifications.filter((n) => !n.isActive);

  return (
    <div className="space-y-4">
      {activeItems.length   > 0 && <LiveGroup label="Active"   items={activeItems} />}
      {inactiveItems.length > 0 && <LiveGroup label="Inactive" items={inactiveItems} dim />}
    </div>
  );
}

function LiveGroup({ label, items, dim }: { label: string; items: ZuperNotification[]; dim?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">{label}</p>
      <div className="space-y-2">
        {items.map((n) => <LiveCard key={n.uid} n={n} dim={dim} />)}
      </div>
    </div>
  );
}

function LiveCard({ n, dim }: { n: ZuperNotification; dim?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  const rawMessage = (n as any).message || '';
  const plainMessage = String(rawMessage)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\{\{[^}]+\}\}/g, '[…]')
    .replace(/\s+/g, ' ')
    .trim();
  const PREVIEW_LEN = 120;
  const isLong = plainMessage.length > PREVIEW_LEN;

  return (
    <div className={`bg-white rounded-xl border border-[#E5E2DC] px-4 py-3 ${dim ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-3">
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${
          n.type === 'SMS' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
        }`}>
          {n.type}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1A1A1A] truncate">{n.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {n.categoryName}
            {n.statusName && (<> · <span className="text-gray-500">{n.statusName}</span></>)}
          </p>
        </div>
      </div>

      {n.emailSubject && (
        <div className="mt-2 pl-[calc(2rem+12px)]">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Subject</p>
          <p className="text-xs text-[#1A1A1A]">{n.emailSubject}</p>
        </div>
      )}

      {plainMessage && (
        <div className="mt-2 pl-[calc(2rem+12px)]">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Message</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            {isLong && !expanded ? plainMessage.slice(0, PREVIEW_LEN) + '…' : plainMessage}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-[11px] font-semibold text-orange-500 hover:text-orange-600 transition-colors mt-1 underline underline-offset-2"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Derived tab (from answers OR defaults) ───────────────────────────────────

function DerivedTab({ items, emptyText }: { items: DerivedNotification[]; emptyText: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-400">{emptyText}</p>;
  }
  return (
    <div className="space-y-2">
      {items.map((n) => <DerivedCard key={n.id} n={n} />)}
    </div>
  );
}

function DerivedCard({ n }: { n: DerivedNotification }) {
  const channelStyle =
    n.channel === 'sms'    ? 'bg-purple-50 text-purple-700' :
    n.channel === 'email'  ? 'bg-blue-50 text-blue-700' :
    n.channel === 'push'   ? 'bg-orange-50 text-orange-700' :
    n.channel === 'in_app' ? 'bg-gray-100 text-gray-700' :
                             'bg-amber-50 text-amber-700';

  return (
    <div className="bg-white rounded-xl border border-[#E5E2DC] px-4 py-3">
      <div className="flex items-center gap-2 flex-wrap mb-1">
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${channelStyle}`}>
          {CHANNEL_LABEL[n.channel]}
        </span>
        <p className="text-sm font-semibold text-[#1A1A1A]">{n.title}</p>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">
        {n.trigger} · to{' '}
        <span className="font-semibold text-[#1A1A1A]">
          {n.audience === 'specific' ? n.audienceLabel : AUDIENCE_LABEL[n.audience]}
        </span>
      </p>
      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{n.description}</p>
    </div>
  );
}
