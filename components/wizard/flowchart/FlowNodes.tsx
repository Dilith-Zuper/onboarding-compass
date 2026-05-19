'use client';

import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { NotifChannel } from '@/lib/notifications/derive';

export type NodeNotificationSummary = {
  title: string;
  channel: NotifChannel;
};

export type CompassNodeData = {
  label: string;
  description: string;
  nodeType: 'start' | 'job' | 'external' | 'action' | 'integration' | 'end';
  isOptional?: boolean;
  isExternal?: boolean;
  notifications?: NodeNotificationSummary[];
};

export type CompassNode = Node<CompassNodeData, 'compass'>;

const STYLES: Record<string, { bg: string; border: string; textCls: string; borderStyle?: string }> = {
  start:       { bg: '#1A1A1A', border: '#1A1A1A', textCls: 'text-white' },
  end:         { bg: '#1A1A1A', border: '#1A1A1A', textCls: 'text-white' },
  job:         { bg: '#EFF6FF', border: '#BFDBFE', textCls: 'text-[#1A1A1A]' },
  external:    { bg: '#F0FDF4', border: '#BBF7D0', textCls: 'text-[#1A1A1A]', borderStyle: 'dashed' },
  integration: { bg: '#FFF7ED', border: '#FED7AA', textCls: 'text-[#1A1A1A]' },
  action:      { bg: '#FAF5FF', border: '#E9D5FF', textCls: 'text-[#1A1A1A]' },
};

const CHANNEL_DOT: Record<NotifChannel, string> = {
  sms:    'bg-purple-500',
  email:  'bg-blue-500',
  push:   'bg-orange-500',
  in_app: 'bg-gray-400',
  mixed:  'bg-amber-500',
};

const MAX_VISIBLE_NOTIFS = 3;

export function CompassNode({ data, selected }: NodeProps<CompassNode>) {
  const s = STYLES[data.nodeType] || STYLES.action;
  const isDashed = s.borderStyle === 'dashed' || data.isOptional;
  const isDarkNode = data.nodeType === 'start' || data.nodeType === 'end';
  const notifs = data.notifications ?? [];
  const visibleNotifs = notifs.slice(0, MAX_VISIBLE_NOTIFS);
  const overflow = notifs.length - visibleNotifs.length;

  return (
    <div
      className={`relative rounded-xl min-w-[160px] max-w-[240px] text-center transition-all select-none
        ${isDashed ? 'border-2 border-dashed' : 'border-2'}
        ${selected ? 'ring-2 ring-orange-400 ring-offset-2' : ''}
      `}
      style={{ background: s.bg, borderColor: selected ? '#F97316' : s.border }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-[#E5E2DC] !border-gray-300"
      />

      <div className="px-3 py-3">
        <p className={`text-xs font-bold leading-tight ${s.textCls}`}>{data.label}</p>

        {(data.isOptional && !data.isExternal) || data.isExternal ? (
          <div className="mt-1.5 flex flex-wrap justify-center gap-1">
            {data.isOptional && !data.isExternal && (
              <span className="inline-block text-[9px] font-bold uppercase tracking-widest text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
                Optional
              </span>
            )}
            {data.isExternal && (
              <span className="inline-block text-[9px] font-bold uppercase tracking-widest text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">
                External
              </span>
            )}
          </div>
        ) : null}

        {notifs.length > 0 && (
          <div className={`mt-2 pt-2 border-t ${isDarkNode ? 'border-white/15' : 'border-[#E5E2DC]'}`}>
            <p
              className={`text-[8px] font-bold uppercase tracking-widest mb-1 ${
                isDarkNode ? 'text-white/60' : 'text-gray-400'
              }`}
            >
              {notifs.length} notif{notifs.length === 1 ? '' : 's'}
            </p>
            <ul className="space-y-0.5 text-left">
              {visibleNotifs.map((n, i) => (
                <li
                  key={`${n.title}-${i}`}
                  className={`flex items-start gap-1.5 text-[10px] leading-snug ${
                    isDarkNode ? 'text-white/85' : 'text-gray-600'
                  }`}
                  title={n.title}
                >
                  <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${CHANNEL_DOT[n.channel]}`} />
                  <span className="truncate">{n.title}</span>
                </li>
              ))}
              {overflow > 0 && (
                <li
                  className={`text-[10px] font-semibold pl-[14px] ${
                    isDarkNode ? 'text-white/60' : 'text-gray-400'
                  }`}
                >
                  +{overflow} more
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-[#E5E2DC] !border-gray-300"
      />
    </div>
  );
}

export const nodeTypes = { compass: CompassNode };
