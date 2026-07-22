'use client';

import type { ZuperCategory } from '@/lib/zuper/transformer';
import { InlineRename } from './InlineRename';
import { getRenamesByKind } from './useRename';

interface Props {
  categories: ZuperCategory[];
  answers: Record<string, any>;
  token: string;
  isPreview: boolean;
}

export function StatusesModule({ categories, answers, token, isPreview }: Props) {
  const categoriesWithStatuses = categories.filter((c) => c.statuses.length > 0);
  const categoryRenames = getRenamesByKind(answers, 'category');
  const statusRenames = getRenamesByKind(answers, 'status');

  if (!categoriesWithStatuses.length) {
    return <p className="text-sm text-gray-500">No statuses found.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 leading-relaxed">
        Click a status name to rename it. Want to <strong>add or remove</strong> statuses? Drop a note in the change request box below.
      </p>
      <div className="grid gap-x-6 gap-y-5 md:grid-cols-2 items-start">
      {categoriesWithStatuses.map((cat) => {
        const catLabel = categoryRenames[cat.uid]?.newName || cat.name;
        return (
          <div key={cat.uid}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color || '#E5E2DC' }} />
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{catLabel}</p>
            </div>
            <div className="space-y-1.5">
              {cat.statuses.map((s) => (
                <div
                  key={s.uid}
                  className="bg-white rounded-xl border border-[#E5E2DC] px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color || '#E5E2DC' }} />
                    <InlineRename
                      token={token}
                      kind="status"
                      uid={s.uid}
                      originalName={s.name}
                      storedRename={statusRenames[s.uid]}
                      isPreview={isPreview}
                      textClassName="text-sm font-semibold text-[#1A1A1A]"
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {s.requireSignature && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                        Sig
                      </span>
                    )}
                    {s.trackTime && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                        Timer
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
