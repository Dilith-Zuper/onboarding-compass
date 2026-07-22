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
  /** Narrower card used for fan-out nodes (lead sources, providers, suppliers) */
  compact?: boolean;
  iconId?: string;
  notifications?: NodeNotificationSummary[];
};

export type CompassNode = Node<CompassNodeData, 'compass'>;

export type CompassGroupData = {
  label: string;
  width: number;
  height: number;
};

export type CompassGroupNode = Node<CompassGroupData, 'compassGroup'>;

/** Fixed widths so centers align into a perfectly straight spine. */
export const NODE_WIDTH = 248;
export const NODE_WIDTH_COMPACT = 196;

const STYLES: Record<
  string,
  { bg: string; border: string; textCls: string; chipBg: string; chipColor: string; borderStyle?: string }
> = {
  start:       { bg: '#1A1A1A', border: '#1A1A1A', textCls: 'text-white', chipBg: 'rgba(255,255,255,0.12)', chipColor: '#FFFFFF' },
  end:         { bg: '#1A1A1A', border: '#1A1A1A', textCls: 'text-white', chipBg: 'rgba(255,255,255,0.12)', chipColor: '#FFFFFF' },
  job:         { bg: '#EFF6FF', border: '#BFDBFE', textCls: 'text-[#1A1A1A]', chipBg: '#DBEAFE', chipColor: '#2563EB' },
  external:    { bg: '#F0FDF4', border: '#BBF7D0', textCls: 'text-[#1A1A1A]', chipBg: '#DCFCE7', chipColor: '#16A34A', borderStyle: 'dashed' },
  integration: { bg: '#FFF7ED', border: '#FED7AA', textCls: 'text-[#1A1A1A]', chipBg: '#FFEDD5', chipColor: '#EA580C' },
  action:      { bg: '#FAF5FF', border: '#E9D5FF', textCls: 'text-[#1A1A1A]', chipBg: '#F3E8FF', chipColor: '#9333EA' },
};

const CHANNEL_DOT: Record<NotifChannel, string> = {
  sms:    'bg-purple-500',
  email:  'bg-blue-500',
  push:   'bg-orange-500',
  in_app: 'bg-gray-400',
  mixed:  'bg-amber-500',
};

const MAX_VISIBLE_NOTIFS = 3;

// ─── Inline icon set (24×24 stroke paths, currentColor) ──────────────────────

const ICON_PATHS: Record<string, React.ReactNode> = {
  person: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 19.5c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" />
    </>
  ),
  phone: (
    <path d="M6 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5l1.5-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5C10.9 19 5 13.1 4.5 5.1A1.5 1.5 0 0 1 6 3.5z" />
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="14.5" rx="2" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
    </>
  ),
  zap: (
    <path d="M13 3L5.5 13.5H11L10 21l7.5-10.5H13L13 3z" />
  ),
  link: (
    <>
      <path d="M9.5 14.5l5-5" />
      <path d="M8 11l-2.5 2.5a3.5 3.5 0 0 0 5 5L13 16" />
      <path d="M16 13l2.5-2.5a3.5 3.5 0 0 0-5-5L11 8" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5.5" y="4.5" width="13" height="16" rx="2" />
      <path d="M9 4.5a3 3 0 0 1 6 0M9 12l2 2 4-4.5" />
    </>
  ),
  home: (
    <>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 9.5V20h12V9.5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5l7 2.5v5.5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-2.5z" />
      <path d="M9 12l2 2 4-4.5" />
    </>
  ),
  calculator: (
    <>
      <rect x="5.5" y="3.5" width="13" height="17" rx="2" />
      <path d="M9 7.5h6M9 12h.01M12 12h.01M15 12h.01M9 15.5h.01M12 15.5h.01M15 15.5h.01" />
    </>
  ),
  doc: (
    <>
      <path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7 3.5z" />
      <path d="M14 3.5V8h4.5M9.5 12.5h5M9.5 16h5" />
    </>
  ),
  box: (
    <>
      <path d="M4.5 8l7.5-4 7.5 4v8l-7.5 4-7.5-4V8z" />
      <path d="M4.5 8l7.5 4 7.5-4M12 12v8" />
    </>
  ),
  hammer: (
    <>
      <path d="M14 5l5 5-2 2-5-5 2-2z" />
      <path d="M12 7L4.5 14.5a1.5 1.5 0 0 0 0 2.1l1.9 1.9a1.5 1.5 0 0 0 2.1 0L16 11" />
    </>
  ),
  dollar: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.2 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6.5v11" />
    </>
  ),
  ruler: (
    <>
      <rect x="3" y="9" width="18" height="6" rx="1.5" transform="rotate(-45 12 12)" />
      <path d="M9 12.5l1.2 1.2M11.5 10l1.2 1.2M14 7.5l1.2 1.2" />
    </>
  ),
  truck: (
    <>
      <path d="M3.5 6.5h10v10h-10zM13.5 10h4l3 3v3.5h-7" />
      <circle cx="7.5" cy="18" r="1.8" />
      <circle cx="16.5" cy="18" r="1.8" />
    </>
  ),
  flag: (
    <path d="M6 21V4.5m0 0c2.5-1.7 5-1.7 7.5 0s5 1.7 7 .5V13c-2 1.2-4.5 1.2-7-.5s-5-1.7-7.5 0" />
  ),
};

function NodeIcon({ iconId, color }: { iconId?: string; color: string }) {
  const paths = ICON_PATHS[iconId ?? ''] ?? ICON_PATHS.zap;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths}
    </svg>
  );
}

// ─── Main node card ──────────────────────────────────────────────────────────

export function CompassNode({ data, selected }: NodeProps<CompassNode>) {
  const s = STYLES[data.nodeType] || STYLES.action;
  const isDashed = s.borderStyle === 'dashed' || data.isOptional;
  const isDarkNode = data.nodeType === 'start' || data.nodeType === 'end';
  const notifs = data.notifications ?? [];
  const visibleNotifs = notifs.slice(0, MAX_VISIBLE_NOTIFS);
  const overflow = notifs.length - visibleNotifs.length;
  const width = data.compact ? NODE_WIDTH_COMPACT : NODE_WIDTH;

  return (
    <div
      className={`relative rounded-xl text-left transition-all select-none
        ${isDashed ? 'border-2 border-dashed' : 'border-2'}
        ${selected ? 'ring-2 ring-orange-400 ring-offset-2' : 'shadow-[0_1px_3px_rgba(26,26,26,0.07)]'}
      `}
      style={{ background: s.bg, borderColor: selected ? '#F97316' : s.border, width }}
    >
      {/* Invisible connection points — edges pick the side that reads cleanest */}
      <Handle id="t-top" type="target" position={Position.Top} className="!w-1 !h-1 !min-w-0 !min-h-0 !border-0 !opacity-0" />
      <Handle id="t-left" type="target" position={Position.Left} className="!w-1 !h-1 !min-w-0 !min-h-0 !border-0 !opacity-0" />
      <Handle id="t-right" type="target" position={Position.Right} className="!w-1 !h-1 !min-w-0 !min-h-0 !border-0 !opacity-0" />
      <Handle id="s-left" type="source" position={Position.Left} className="!w-1 !h-1 !min-w-0 !min-h-0 !border-0 !opacity-0" />
      <Handle id="s-right" type="source" position={Position.Right} className="!w-1 !h-1 !min-w-0 !min-h-0 !border-0 !opacity-0" />

      <div className={data.compact ? 'px-3 py-2.5' : 'px-3.5 py-3'}>
        <div className="flex items-center gap-2.5">
          <div
            className={`shrink-0 rounded-lg flex items-center justify-center ${data.compact ? 'w-7 h-7' : 'w-8 h-8'}`}
            style={{ background: s.chipBg }}
          >
            <NodeIcon iconId={data.iconId} color={s.chipColor} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`${data.compact ? 'text-[11px]' : 'text-xs'} font-bold leading-tight ${s.textCls}`}>
              {data.label}
            </p>
            {(data.isOptional && !data.isExternal) || data.isExternal ? (
              <div className="mt-1 flex flex-wrap gap-1">
                {data.isOptional && !data.isExternal && (
                  <span className="inline-block text-[8px] font-bold uppercase tracking-widest text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
                    Optional
                  </span>
                )}
                {data.isExternal && (
                  <span className="inline-block text-[8px] font-bold uppercase tracking-widest text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">
                    External
                  </span>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {notifs.length > 0 && (
          <div className={`mt-2.5 pt-2 border-t ${isDarkNode ? 'border-white/15' : 'border-black/[0.06]'}`}>
            <p
              className={`text-[8px] font-bold uppercase tracking-widest mb-1 ${
                isDarkNode ? 'text-white/60' : 'text-gray-400'
              }`}
            >
              {notifs.length} notif{notifs.length === 1 ? '' : 's'}
            </p>
            <ul className="space-y-0.5">
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

      <Handle id="s-bottom" type="source" position={Position.Bottom} className="!w-1 !h-1 !min-w-0 !min-h-0 !border-0 !opacity-0" />
    </div>
  );
}

// ─── Labeled group container (dashed box around fan-out clusters) ────────────

export function CompassGroupNode({ data }: NodeProps<CompassGroupNode>) {
  return (
    <div
      className="rounded-2xl border-2 border-dashed border-[#C9C4BA] bg-[#FAF9F7]/50 pointer-events-none"
      style={{ width: data.width, height: data.height }}
    >
      <span className="absolute -top-[9px] left-1/2 -translate-x-1/2 bg-white border border-[#E5E2DC] rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-gray-500 whitespace-nowrap">
        {data.label}
      </span>
    </div>
  );
}

export const nodeTypes = { compass: CompassNode, compassGroup: CompassGroupNode };
