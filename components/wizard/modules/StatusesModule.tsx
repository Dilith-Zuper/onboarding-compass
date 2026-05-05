import type { ZuperCategory } from '@/lib/zuper/transformer';
import { STATUS_TYPE_LABELS } from '@/lib/zuper/transformer';

interface Props {
  categories: ZuperCategory[];
}

const TYPE_BADGE: Record<string, string> = {
  NEW:       'bg-blue-50 text-blue-700',
  STARTED:   'bg-orange-50 text-orange-700',
  COMPLETED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-red-50 text-red-600',
  ON_MY_WAY: 'bg-purple-50 text-purple-700',
  OTHER:     'bg-gray-100 text-gray-500',
};

export function StatusesModule({ categories }: Props) {
  const categoriesWithStatuses = categories.filter((c) => c.statuses.length > 0);

  if (!categoriesWithStatuses.length) {
    return <p className="text-sm text-gray-500">No statuses found.</p>;
  }

  return (
    <div className="space-y-4">
      {categoriesWithStatuses.map((cat) => (
        <div key={cat.uid}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color || '#E5E2DC' }} />
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{cat.name}</p>
          </div>
          <div className="space-y-1.5">
            {cat.statuses.map((s) => (
              <div
                key={s.uid}
                className="bg-white rounded-xl border border-[#E5E2DC] px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color || '#E5E2DC' }} />
                  <p className="text-sm font-semibold text-[#1A1A1A]">{s.name}</p>
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
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_BADGE[s.type] || TYPE_BADGE.OTHER}`}>
                    {STATUS_TYPE_LABELS[s.type] || s.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
