'use client';

import { useState } from 'react';
import type { ZuperChecklist, ZuperChecklistItem } from '@/lib/zuper/transformer';

interface Props {
  checklists: ZuperChecklist[];
}

export function ChecklistsModule({ checklists }: Props) {
  const [openUid, setOpenUid] = useState<string | null>(checklists[0]?.categoryUid ?? null);

  const nonEmpty = checklists.filter((c) => c.items.length > 0);

  if (!nonEmpty.length) {
    return <p className="text-sm text-gray-500">No checklist items found.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 leading-relaxed">
        This is how the checklist appears to your technician on the Zuper mobile app — preview only, not editable here.
      </p>
      {nonEmpty.map((cl) => {
        const isOpen = openUid === cl.categoryUid;
        return (
          <div key={cl.categoryUid} className="bg-white rounded-2xl border border-[#E5E2DC] overflow-hidden">
            <button
              onClick={() => setOpenUid(isOpen ? null : cl.categoryUid)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#FAF9F7] transition-colors"
            >
              <div>
                <p className="text-sm font-bold text-[#1A1A1A]">{cl.categoryName}</p>
                <p className="text-xs text-gray-400 mt-0.5">{cl.items.length} item{cl.items.length !== 1 ? 's' : ''}</p>
              </div>
              <svg
                width="16" height="16" viewBox="0 0 16 16" fill="none"
                className={`shrink-0 transition-transform duration-200 text-gray-400 ${isOpen ? 'rotate-180' : ''}`}
              >
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {isOpen && (
              <div className="border-t border-[#E5E2DC] bg-[#FAF9F7] p-4 sm:p-5">
                {/* Phone-style frame for the tech-view stack */}
                <div className="mx-auto max-w-md bg-white border border-[#E5E2DC] rounded-2xl shadow-sm overflow-hidden">
                  <div className="bg-[#1A1A1A] px-4 py-3 flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Tech view</p>
                    <p className="text-xs font-semibold text-white">{cl.categoryName}</p>
                  </div>
                  <div className="divide-y divide-[#F0EDE7]">
                    {cl.items.map((item) => (
                      <ChecklistFieldPreview key={item.uid} item={item} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Per-item field preview ─────────────────────────────────────────────────

function ChecklistFieldPreview({ item }: { item: ZuperChecklistItem }) {
  return (
    <div className="px-4 py-3">
      <p className="text-sm font-semibold text-[#1A1A1A] leading-snug">
        {item.label}
        {item.isRequired && <span className="ml-1.5 text-orange-500">*</span>}
      </p>
      {item.description && (
        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{item.description}</p>
      )}
      <div className="mt-2">
        <FieldControl item={item} />
      </div>
    </div>
  );
}

function FieldControl({ item }: { item: ZuperChecklistItem }) {
  switch (item.type) {
    case 'RADIO':
      return (
        <div className="flex gap-2">
          {['Yes', 'No'].map((label) => (
            <span
              key={label}
              className="flex-1 text-center text-sm font-semibold py-2 rounded-xl border-2 border-[#E5E2DC] text-gray-400 bg-white"
            >
              {label}
            </span>
          ))}
        </div>
      );

    case 'SINGLE_ITEM': {
      const opts = item.options.length > 0 ? item.options : ['Option A', 'Option B'];
      return (
        <div className="flex items-center justify-between bg-white border border-[#E5E2DC] rounded-xl px-3 py-2.5">
          <span className="text-sm text-gray-500">{opts[0] || 'Select…'}</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-300">
            <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      );
    }

    case 'MULTI_SELECT': {
      const opts = item.options.length > 0 ? item.options : ['Option A', 'Option B'];
      return (
        <div className="space-y-1.5">
          {opts.slice(0, 4).map((o) => (
            <div key={o} className="flex items-center gap-2">
              <span className="w-4 h-4 rounded border-2 border-[#E5E2DC] bg-white shrink-0" />
              <span className="text-sm text-gray-500">{o}</span>
            </div>
          ))}
          {opts.length > 4 && (
            <p className="text-[11px] text-gray-400 pl-6">+{opts.length - 4} more options</p>
          )}
        </div>
      );
    }

    case 'CHECKBOX':
      return (
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded border-2 border-[#E5E2DC] bg-white shrink-0" />
          <span className="text-sm text-gray-400">Confirm</span>
        </div>
      );

    case 'TEXT':
      return (
        <div className="bg-white border border-[#E5E2DC] rounded-xl px-3 py-2.5">
          <span className="text-sm text-gray-300">Tech types here…</span>
        </div>
      );

    case 'NUMBER':
      return (
        <div className="bg-white border border-[#E5E2DC] rounded-xl px-3 py-2.5">
          <span className="text-sm text-gray-300">0</span>
        </div>
      );

    case 'DATE':
      return (
        <div className="flex items-center justify-between bg-white border border-[#E5E2DC] rounded-xl px-3 py-2.5">
          <span className="text-sm text-gray-300">Pick a date</span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-gray-300">
            <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M1.5 5.5h11M4.5 1.5v2M9.5 1.5v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </div>
      );

    case 'PHOTO':
      return (
        <div className="border-2 border-dashed border-[#E5E2DC] rounded-xl px-3 py-4 flex flex-col items-center justify-center bg-[#FAF9F7]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-gray-300 mb-1">
            <path d="M3 8a2 2 0 0 1 2-2h2.5l1.5-2h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          <span className="text-xs text-gray-400 font-medium">Tap to capture photo</span>
        </div>
      );

    case 'SIGNATURE':
      return (
        <div className="border border-[#E5E2DC] rounded-xl px-3 py-3 bg-[#FAF9F7]">
          <div className="h-10 border-b border-dashed border-gray-300" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300 mt-1">Sign here</p>
        </div>
      );

    default:
      return (
        <div className="bg-white border border-[#E5E2DC] rounded-xl px-3 py-2.5">
          <span className="text-sm text-gray-300">{item.type}</span>
        </div>
      );
  }
}
