'use client';

import { useState } from 'react';
import type { ZuperNotification } from '@/lib/zuper/transformer';

interface Props {
  notifications: ZuperNotification[];
}

export function NotificationsModule({ notifications }: Props) {
  if (!notifications.length) {
    return <p className="text-sm text-gray-500">No notifications configured yet.</p>;
  }

  const active   = notifications.filter((n) => n.isActive);
  const inactive = notifications.filter((n) => !n.isActive);

  return (
    <div className="space-y-4">
      {active.length > 0   && <NotifGroup label="Active"   items={active} />}
      {inactive.length > 0 && <NotifGroup label="Inactive" items={inactive} dim />}
    </div>
  );
}

function NotifGroup({ label, items, dim }: { label: string; items: ZuperNotification[]; dim?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">{label}</p>
      <div className="space-y-2">
        {items.map((n) => <NotifCard key={n.uid} n={n} dim={dim} />)}
      </div>
    </div>
  );
}

function NotifCard({ n, dim }: { n: ZuperNotification; dim?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  // Strip HTML tags from message body for display
  const rawMessage = n.message || '';
  const plainMessage = rawMessage.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const PREVIEW_LEN = 120;
  const isLong = plainMessage.length > PREVIEW_LEN;

  return (
    <div
      className={`bg-white rounded-xl border border-[#E5E2DC] px-4 py-3 ${dim ? 'opacity-50' : ''}`}
    >
      {/* Header row */}
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
            {n.statusName && (
              <> · <span className="text-gray-500">{n.statusName}</span></>
            )}
          </p>
        </div>
      </div>

      {/* Subject */}
      {n.emailSubject && (
        <div className="mt-2 pl-[calc(2rem+12px)]">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Subject</p>
          <p className="text-xs text-[#1A1A1A]">{n.emailSubject}</p>
        </div>
      )}

      {/* Message body */}
      {plainMessage && (
        <div className="mt-2 pl-[calc(2rem+12px)]">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Message</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            {isLong && !expanded
              ? plainMessage.slice(0, PREVIEW_LEN) + '…'
              : plainMessage}
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
