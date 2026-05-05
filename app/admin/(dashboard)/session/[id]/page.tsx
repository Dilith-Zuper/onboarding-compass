import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDistanceToNow, format } from 'date-fns';
import { CopyButton } from '@/components/admin/CopyButton';
import { GoLiveButton } from '@/components/admin/GoLiveButton';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending:     { label: 'Pending',     cls: 'bg-gray-100 text-gray-500' },
  in_progress: { label: 'In progress', cls: 'bg-blue-50 text-blue-700' },
  submitted:   { label: 'Submitted',   cls: 'bg-amber-50 text-amber-700' },
  live:        { label: 'Live',        cls: 'bg-green-50 text-green-700' },
};

export default async function SessionDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: session, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !session) notFound();

  const [
    { data: snapshot },
    { data: responses },
    { data: changeRequests },
    { data: submission },
  ] = await Promise.all([
    supabase.from('snapshots').select('*').eq('session_id', params.id).order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('responses').select('*').eq('session_id', params.id).order('created_at', { ascending: true }),
    supabase.from('change_requests').select('*').eq('session_id', params.id).order('created_at', { ascending: true }),
    supabase.from('submissions').select('*').eq('session_id', params.id).single(),
  ]);

  const badge = STATUS_BADGE[session.status] || STATUS_BADGE.pending;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const customerLink = `${appUrl}/w/${session.unique_token}`;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link href="/admin" className="text-sm text-gray-400 hover:text-orange-500 transition-colors">
        ← Sessions
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E5E2DC] p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">
              {format(new Date(session.created_at), 'MMM d, yyyy')} · {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
            </p>
            <h1 className="text-[32px] font-extrabold text-[#1A1A1A] leading-tight">
              {session.org_name}
            </h1>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>
            {badge.label}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#E5E2DC]">
          <InfoField label="Customer" value={session.customer_email} />
          <InfoField label="SA / BA"  value={session.sa_email} />
          <InfoField label="Region"   value={session.dc_region} />
        </div>

        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#E5E2DC]">
          <span className="text-xs font-mono text-gray-400 flex-1 truncate">{customerLink}</span>
          <CopyButton text={customerLink} />
        </div>
      </div>

      {/* Snapshot */}
      <Section title="Account snapshot">
        {snapshot ? (
          <>
            <p className="text-xs text-gray-400 mb-4">
              Fetched {formatDistanceToNow(new Date(snapshot.fetched_at), { addSuffix: true })}
            </p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Categories',    count: snapshot.categories?.length ?? 0 },
                { label: 'Checklists',    count: snapshot.checklists?.length ?? 0 },
                { label: 'Notifications', count: snapshot.notifications?.length ?? 0 },
                { label: 'Workflows',     count: snapshot.workflows?.length ?? 0 },
              ].map((item) => (
                <div key={item.label} className="bg-[#FAF9F7] rounded-xl border border-[#E5E2DC] p-4 text-center">
                  <p className="text-[40px] font-extrabold text-[#1A1A1A] leading-tight">
                    {item.count.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 font-medium">{item.label}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500">Snapshot not yet fetched.</p>
        )}
      </Section>

      {/* Responses */}
      <Section title={`Discovery responses${responses?.length ? ` · ${responses.length}` : ''}`}>
        {responses && responses.length > 0 ? (
          <div className="space-y-2">
            {responses.map((r) => (
              <div key={r.id} className="flex gap-4 py-2 border-b border-[#E5E2DC] last:border-0 text-sm">
                <span className="font-mono text-xs text-gray-400 w-52 shrink-0 pt-0.5">{r.question_id}</span>
                <span className="text-[#1A1A1A]">
                  {Array.isArray(r.answer) ? r.answer.join(', ') : String(r.answer)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No responses yet.</p>
        )}
      </Section>

      {/* Change requests */}
      <Section title={`Change requests${changeRequests?.length ? ` · ${changeRequests.length}` : ''}`}>
        {changeRequests && changeRequests.length > 0 ? (
          <div className="space-y-3">
            {changeRequests.map((cr) => (
              <div key={cr.id} className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">
                  {cr.module}
                </p>
                <p className="text-sm text-[#1A1A1A]">{cr.request_text}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No change requests yet.</p>
        )}
      </Section>

      {/* Submission */}
      {submission && (
        <Section title="Submission">
          <div className="space-y-3">
            <InfoField label="Submitted"   value={format(new Date(submission.submitted_at), 'MMM d, yyyy HH:mm')} />
            <InfoField label="Flow variant" value={submission.flow_variant || '—'} />
            <InfoField label="Brands"       value={submission.selected_brands?.join(', ') || '—'} />
            <InfoField label="Vendors"      value={submission.selected_vendors?.join(', ') || '—'} />
            {submission.pdf_url && (
              <a href={submission.pdf_url} target="_blank" rel="noreferrer"
                className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                Download onboarding PDF →
              </a>
            )}
          </div>
        </Section>
      )}

      {/* Go-live report */}
      {(session.status === 'submitted' || session.status === 'live') && (
        <Section title="Go-live report">
          {session.status === 'live' ? (
            <p className="text-sm text-gray-500">
              This session is live. Go-live report has been generated and emailed to{' '}
              <span className="font-medium text-[#1A1A1A]">support@zuper.co</span>.
            </p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 leading-relaxed">
                When configuration is complete, generate the go-live report. This will fetch the
                current Zuper account state, diff it against the original snapshot, generate a PDF,
                and email it to <span className="font-medium text-[#1A1A1A]">support@zuper.co</span>.
              </p>
              <GoLiveButton sessionId={params.id} orgName={session.org_name} />
            </div>
          )}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E2DC] p-6">
      <h2 className="text-[17px] font-extrabold text-[#1A1A1A] leading-snug mb-4">{title}</h2>
      {children}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-[#1A1A1A]">{value}</p>
    </div>
  );
}
