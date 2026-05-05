import type { ConfigLevel } from '@/lib/configMatrix';

const STYLES: Record<ConfigLevel, string> = {
  renameable: 'bg-blue-50 text-blue-700',
  sa_managed: 'bg-amber-50 text-amber-700',
  fixed:      'bg-gray-100 text-gray-500',
};

const LABELS: Record<ConfigLevel, string> = {
  renameable: 'Renameable',
  sa_managed: 'SA-managed',
  fixed:      'Fixed',
};

export function ConfigBadge({ level }: { level: ConfigLevel }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STYLES[level]}`}>
      {LABELS[level]}
    </span>
  );
}
