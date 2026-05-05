'use client';

import { useRef, useState } from 'react';
import { ConfigBadge } from '@/components/shared/Badge';
import type { ModuleConfig } from '@/lib/configMatrix';

interface ModuleCardProps {
  config: ModuleConfig;
  token: string;
  changeRequest: string;
  onChangeRequest: (text: string) => void;
  children: React.ReactNode;
}

export function ModuleCard({ config, token, changeRequest, onChangeRequest, children }: ModuleCardProps) {
  const [localValue, setLocalValue] = useState(changeRequest);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(text: string) {
    setLocalValue(text);
    onChangeRequest(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSaving(true);
      await fetch(`/api/customer/${token}/change-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: config.module, request_text: text }),
      });
      setSaving(false);
    }, 500);
  }

  return (
    <div className="space-y-5">
      {/* Config note */}
      <div className="flex items-start gap-3 bg-[#F5F3F0] rounded-2xl px-5 py-4">
        <div className="shrink-0 mt-0.5">
          <ConfigBadge level={config.configLevel} />
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">{config.configNote}</p>
      </div>

      {/* Data */}
      {children}

      {/* Change request */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">
          {config.changeRequestPrompt}
        </p>
        <div className="bg-white rounded-2xl border border-[#E5E2DC] px-5 py-4 space-y-1 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Change request {saving && <span className="normal-case font-normal text-gray-400">· saving…</span>}
          </label>
          <textarea
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={config.changeRequestPlaceholder}
            rows={3}
            className="w-full text-[#1A1A1A] text-sm placeholder-gray-300 focus:outline-none bg-transparent resize-none leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
}
