'use client';

import { useState } from 'react';
import type { ZuperChecklist } from '@/lib/zuper/transformer';
import { FIELD_TYPE_LABELS } from '@/lib/zuper/transformer';

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
    <div className="space-y-2">
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
              <div className="border-t border-[#E5E2DC]">
                {cl.items.map((item, i) => (
                  <div
                    key={item.uid}
                    className={`flex items-start gap-3 px-5 py-3 ${i < cl.items.length - 1 ? 'border-b border-[#E5E2DC]' : ''}`}
                  >
                    <span className="text-xs font-bold text-gray-300 mt-0.5 w-5 shrink-0 text-right">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#1A1A1A]">
                        {item.label}
                        {item.isRequired && (
                          <span className="ml-1.5 text-[10px] font-bold text-orange-500">*</span>
                        )}
                      </p>
                      {item.description && (
                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{item.description}</p>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-gray-400 shrink-0 bg-[#F5F3F0] px-2 py-0.5 rounded-full">
                      {FIELD_TYPE_LABELS[item.type] || item.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
