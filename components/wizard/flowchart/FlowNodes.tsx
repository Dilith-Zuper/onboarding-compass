'use client';

import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';

export type CompassNodeData = {
  label: string;
  description: string;
  nodeType: 'start' | 'job' | 'external' | 'action' | 'integration' | 'end';
  isOptional?: boolean;
  isExternal?: boolean;
  notificationCount?: number;
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

export function CompassNode({ data, selected }: NodeProps<CompassNode>) {
  const s = STYLES[data.nodeType] || STYLES.action;
  const isDashed = s.borderStyle === 'dashed' || data.isOptional;

  return (
    <div
      className={`relative rounded-xl min-w-[140px] max-w-[180px] text-center transition-all select-none
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

      <div className="px-4 py-3">
        <p className={`text-xs font-bold leading-tight ${s.textCls}`}>{data.label}</p>
        {data.isOptional && !data.isExternal && (
          <span className="mt-1.5 inline-block text-[9px] font-bold uppercase tracking-widest text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
            Optional
          </span>
        )}
        {data.isExternal && (
          <span className="mt-1.5 inline-block text-[9px] font-bold uppercase tracking-widest text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">
            External
          </span>
        )}
        {!!data.notificationCount && data.notificationCount > 0 && (
          <span
            className={`mt-1.5 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
              data.nodeType === 'start' || data.nodeType === 'end'
                ? 'bg-white/15 text-white'
                : 'bg-orange-50 text-orange-600'
            }`}
            title={`${data.notificationCount} notification${data.notificationCount === 1 ? '' : 's'} fire here`}
          >
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 4l4 3 4-3M2 4v6h8V4M2 4l4-2 4 2"/>
            </svg>
            {data.notificationCount} {data.notificationCount === 1 ? 'notif' : 'notifs'}
          </span>
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
