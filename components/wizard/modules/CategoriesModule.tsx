import type { ZuperCategory } from '@/lib/zuper/transformer';

interface Props {
  categories: ZuperCategory[];
}

export function CategoriesModule({ categories }: Props) {
  if (!categories.length) {
    return <p className="text-sm text-gray-500">No categories found.</p>;
  }

  return (
    <div className="space-y-2">
      {categories.map((cat) => (
        <div
          key={cat.uid}
          className="bg-white rounded-2xl border border-[#E5E2DC] px-5 py-4 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ background: cat.color || '#E5E2DC' }}
            />
            <div>
              <p className="text-sm font-bold text-[#1A1A1A]">{cat.name}</p>
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
