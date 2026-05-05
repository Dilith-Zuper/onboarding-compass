import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Session } from '@/types/supabase';
import { formatDistanceToNow } from 'date-fns';
import { CopyButton } from '@/components/admin/CopyButton';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending:     { label: 'Pending',     cls: 'bg-gray-100 text-gray-500' },
  in_progress: { label: 'In progress', cls: 'bg-blue-50 text-blue-700' },
  submitted:   { label: 'Submitted',   cls: 'bg-amber-50 text-amber-700' },
  live:        { label: 'Live',        cls: 'bg-green-50 text-green-700' },
};

export default async function AdminDashboard() {
  const supabase = createClient();
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">
            Admin
          </p>
          <h1 className="text-[32px] font-extrabold text-[#1A1A1A] leading-tight">
            Sessions
          </h1>
        </div>
        <Link
          href="/admin/new"
          className="h-10 px-5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition-colors text-sm flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 2v10M2 7h10" stroke="white" strokeWidth="2"/>
          </svg>
          New session
        </Link>
      </div>

      {!sessions || sessions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E2DC] p-12 text-center">
          <p className="text-[17px] font-extrabold text-[#1A1A1A] leading-snug mb-1">
            No sessions yet
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Create a session to generate a customer onboarding link.
          </p>
          <Link
            href="/admin/new"
            className="inline-flex h-10 px-5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition-colors text-sm items-center"
          >
            New session →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E2DC] overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-[#F5F3F0]">
                {['Organisation', 'Customer', 'SA', 'Status', 'Created', ''].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 first:rounded-tl-2xl last:rounded-tr-2xl"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(sessions as Session[]).map((s) => {
                const badge = STATUS_BADGE[s.status] || STATUS_BADGE.pending;
                return (
                  <tr
                    key={s.id}
                    className="border-t border-[#E5E2DC] hover:bg-[#FAF9F7] transition-colors"
                  >
                    <td className="px-5 py-4 font-semibold text-[#1A1A1A]">
                      {s.org_name}
                    </td>
                    <td className="px-5 py-4 text-gray-500">{s.customer_email}</td>
                    <td className="px-5 py-4 text-gray-500">{s.sa_email}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400">
                      {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <Link
                          href={`/admin/session/${s.id}`}
                          className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                        >
                          View
                        </Link>
                        <CopyButton text={`${appUrl}/w/${s.unique_token}`} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
