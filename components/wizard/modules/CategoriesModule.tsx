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

export function CategoriesModule({ categories, answers, token, isPreview }: Props) {
  const renames = getRenamesByKind(answers, 'category');

  if (!categories.length) {
    return <p className="text-sm text-gray-500">No categories found.</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 leading-relaxed">
        Click a category name to rename it. Want to <strong>add or remove</strong> categories instead? Drop a note in the change request box below.
      </p>
      {categories.map((cat) => (
        <div
          key={cat.uid}
          className="bg-white rounded-2xl border border-[#E5E2DC] px-5 py-4 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ background: cat.color || '#E5E2DC' }}
            />
            <div className="flex-1 min-w-0">
              <InlineRename
                token={token}
                kind="category"
                uid={cat.uid}
                originalName={cat.name}
                storedRename={renames[cat.uid]}
                isPreview={isPreview}
                textClassName="text-sm font-bold text-[#1A1A1A]"
              />
              {cat.businessUnits.length > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">{cat.businessUnits.join(', ')}</p>
              )}
            </div>
          </div>
          <span className="text-xs font-semibold text-gray-400 shrink-0">
            {cat.statuses.length} status{cat.statuses.length !== 1 ? 'es' : ''}
          </span>
        </div>
      ))}
    </div>
  );
}
