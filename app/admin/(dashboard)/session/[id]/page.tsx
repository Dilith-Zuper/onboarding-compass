import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDistanceToNow, formatDistanceStrict, format } from 'date-fns';
import { CopyButton } from '@/components/admin/CopyButton';
import { RefreshSnapshotButton } from '@/components/admin/RefreshSnapshotButton';
import { SendInviteButton } from '@/components/admin/SendInviteButton';
import { ReopenButton } from '@/components/admin/ReopenButton';
import { getAppUrl } from '@/lib/appUrl';
import { computeWidgetMode } from '@/lib/questions';
import { formatAnswer, getAnsweredBySection } from '@/lib/answers';
import { QUESTIONS } from '@/lib/questions';

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
    supabase.from('snapshots').select('*').eq('session_id', params.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('responses').select('*').eq('session_id', params.id).order('created_at', { ascending: true }),
    supabase.from('change_requests').select('*').eq('session_id', params.id).order('created_at', { ascending: true }),
    supabase.from('submissions').select('*').eq('session_id', params.id).order('submitted_at', { ascending: false }).limit(1).maybeSingle(),
  ]);

  const badge = STATUS_BADGE[session.status] || STATUS_BADGE.pending;

  // Extract renames from responses (stored as __rename:category:<uid> / __rename:status:<uid>)
  const renames = (responses ?? [])
    .filter((r) => r.question_id.startsWith('__rename:'))
    .flatMap((r) => {
      const parts = r.question_id.split(':'); // ['__rename', 'category', uid]
      const kind = parts[1] as 'category' | 'status';
      const val = r.answer as { newName?: string; originalName?: string } | null;
      if (!val || !val.newName || !val.originalName) return [];
      return [{ kind, originalName: val.originalName, newName: val.newName }];
    });

  // Rebuild the answers map from stored responses (includes __other:* keys)
  const answersMap: Record<string, any> = {};
  for (const r of responses ?? []) {
    if (!r.question_id.startsWith('__rename:')) answersMap[r.question_id] = r.answer;
  }

  const answeredBySection = getAnsweredBySection(answersMap);
  const answeredCount = answeredBySection.reduce((n, g) => n + g.items.length, 0);

  // Key decisions for the SA's prep call
  const widget = computeWidgetMode(answersMap);
  const jobTypes: string[] = Array.isArray(answersMap['job_types']) ? answersMap['job_types'] : [];
  const decisionOf = (id: string) => {
    const q = QUESTIONS.find((qq) => qq.id === id);
    return q ? formatAnswer(q, answersMap) : null;
  };
  const keyDecisions: Array<{ label: string; value: string }> = [
    { label: 'Lead qualification', value: answersMap['has_lead_qualification'] === 'yes'
        ? `Yes — ${decisionOf('qualification_platform') ?? 'platform TBD'}`
        : answersMap['has_lead_qualification'] === 'no' ? 'No — direct to inspection' : '' },
    { label: 'Booking widget', value: widget ? widget.mode : (answersMap['wants_booking_widget'] === 'no' ? 'Not wanted' : '') },
    { label: 'Insurance work', value: jobTypes.length ? (jobTypes.includes('insurance_storm') ? 'Yes' : 'No — retail only') : '' },
    { label: 'Zuper Connect', value: answersMap['uses_zuper_connect'] === 'yes'
        ? (answersMap['migrate_number'] === 'yes' ? 'Activate — port existing number' : 'Activate — new number')
        : (answersMap['uses_zuper_connect'] === 'later' ? 'Skip for now' : '') },
    { label: 'Deposits', value: decisionOf('collects_deposit') ?? '' },
    { label: 'Payment timing', value: decisionOf('payment_timing') ?? '' },
    { label: 'Suppliers', value: decisionOf('suppliers') ?? '' },
    { label: 'Brands', value: decisionOf('brands') ?? '' },
  ].filter((d) => d.value);

  const appUrl = getAppUrl();
  const customerLink = `${appUrl}/w/${session.unique_token}`;

  const openedAt: string | null = session.first_opened_at ?? null;

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

        <div className="grid grid-cols-4 gap-4 pt-4 border-t border-[#E5E2DC]">
          <InfoField label="Customer" value={session.customer_email} />
          <InfoField label="SA / BA"  value={session.sa_email} />
          <InfoField label="Region"   value={session.dc_region} />
          <InfoField label="Opened"   value={openedAt ? formatDistanceToNow(new Date(openedAt), { addSuffix: true }) : 'Not yet'} />
        </div>

        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#E5E2DC]">
          <span className="text-xs font-mono text-gray-400 flex-1 truncate">{customerLink}</span>
          <CopyButton text={customerLink} />
          <a
            href={`${customerLink}?preview=true`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors whitespace-nowrap"
          >
            Preview as customer →
          </a>
        </div>
        <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-[#E5E2DC]">
          {(session.status === 'submitted' || session.status === 'live') && (
            <ReopenButton sessionId={params.id} />
          )}
          <SendInviteButton sessionId={params.id} />
        </div>
      </div>

      {/* Snapshot */}
      <Section title="Account snapshot">
        <div className="flex justify-end mb-4">
          <RefreshSnapshotButton token={session.unique_token} />
        </div>
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

      {/* Renames */}
      {renames.length > 0 && (
        <Section title={`Customer renames · ${renames.length}`}>
          <div className="overflow-hidden rounded-xl border border-[#E5E2DC]">
            <div className="grid grid-cols-[100px_1fr_1fr] bg-[#FAF9F7] border-b border-[#E5E2DC]">
              <div className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Kind</div>
              <div className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">In Zuper account</div>
              <div className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Customer renamed to</div>
            </div>
            {renames.map((r, i) => (
              <div
                key={i}
                className="grid grid-cols-[100px_1fr_1fr] border-b border-[#E5E2DC] last:border-0 bg-white hover:bg-amber-50 transition-colors"
              >
                <div className="px-4 py-3 flex items-center">
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${r.kind === 'category' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                    {r.kind}
                  </span>
                </div>
                <div className="px-4 py-3 flex items-center">
                  <span className="text-sm text-gray-400 line-through">{r.originalName}</span>
                </div>
                <div className="px-4 py-3 flex items-center gap-2">
                  <span className="text-sm font-semibold text-amber-700">{r.newName}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Renamed</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Call prep — the decisions that shape the SA session */}
      {keyDecisions.length > 0 && (
        <Section title="Call prep">
          <div className="grid grid-cols-2 gap-3">
            {keyDecisions.map((d) => (
              <div key={d.label} className="bg-[#FAF9F7] rounded-xl border border-[#E5E2DC] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{d.label}</p>
                <p className="text-sm font-semibold text-[#1A1A1A] leading-snug">{d.value}</p>
              </div>
            ))}
          </div>
          {widget && (
            <p className="text-xs text-gray-500 leading-relaxed mt-3">{widget.description}</p>
          )}
        </Section>
      )}

      {/* Answers grouped by section, with real question text and labels */}
      <Section title={`Discovery answers${answeredCount ? ` · ${answeredCount}` : ''}`}>
        {answeredCount > 0 ? (
          <div className="space-y-5">
            {answeredBySection.map(({ section, items }) => (
              <div key={section.id}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-orange-500 mb-2">
                  {section.label}
                </p>
                <div className="rounded-xl border border-[#E5E2DC] overflow-hidden">
                  {items.map(({ question, display }) => {
                    const upload = question.type === 'file_upload'
                      && answersMap[question.id] && typeof answersMap[question.id] === 'object'
                      ? answersMap[question.id] as { url?: string; fileName?: string }
                      : null;
                    return (
                      <div key={question.id} className="flex flex-col sm:flex-row sm:gap-4 gap-0.5 px-4 py-2.5 border-b border-[#E5E2DC] last:border-0 bg-white">
                        <p className="text-xs text-gray-400 sm:w-64 shrink-0 leading-relaxed">{question.text}</p>
                        {upload?.url ? (
                          <a
                            href={upload.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                          >
                            {upload.fileName || 'Uploaded file'} →
                          </a>
                        ) : (
                          <p className="text-sm font-semibold text-[#1A1A1A] leading-snug">{display}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
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
            <InfoField
              label="Time to complete"
              value={openedAt
                ? formatDistanceStrict(new Date(submission.submitted_at), new Date(openedAt))
                : formatDistanceStrict(new Date(submission.submitted_at), new Date(session.created_at)) + ' (from invite)'}
            />
            <InfoField label="Brands"       value={submission.selected_brands?.join(', ') || '—'} />
            <InfoField label="Suppliers"    value={submission.selected_vendors?.join(', ') || '—'} />
            {submission.pdf_url && (
              <a href={submission.pdf_url} target="_blank" rel="noreferrer"
                className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                Download onboarding PDF →
              </a>
            )}
          </div>
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
