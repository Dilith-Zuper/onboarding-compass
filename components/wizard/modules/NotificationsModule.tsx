import type { ZuperNotification } from '@/lib/zuper/transformer';

interface Props {
  notifications: ZuperNotification[];
}

export function NotificationsModule({ notifications }: Props) {
  if (!notifications.length) {
    return <p className="text-sm text-gray-500">No notifications configured yet.</p>;
  }

  const active   = notifications.filter((n) => n.isActive);
  const inactive = notifications.filter((n) => !n.isActive);

  return (
    <div className="space-y-4">
      {active.length > 0 && <NotifGroup label="Active" items={active} />}
      {inactive.length > 0 && <NotifGroup label="Inactive" items={inactive} dim />}
    </div>
  );
}

function NotifGroup({ label, items, dim }: { label: string; items: ZuperNotification[]; dim?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">{label}</p>
      <div className="space-y-1.5">
        {items.map((n) => (
          <div
            key={n.uid}
            className={`bg-white rounded-xl border border-[#E5E2DC] px-4 py-3 flex items-start gap-3 ${dim ? 'opacity-50' : ''}`}
          >
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${
              n.type === 'SMS' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
            }`}>
              {n.type}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1A1A1A] truncate">{n.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {n.categoryName}
                {n.statusName && <> · <span className="text-gray-500">{n.statusName}</span></>}
              </p>
              {n.emailSubject && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">Subject: {n.emailSubject}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
