import { Document, Page, Text, View, Image, Link, StyleSheet } from '@react-pdf/renderer';
import { SECTIONS } from '@/lib/questions';
import { getAnsweredQuestions } from '@/lib/answers';
import { CONFIG_MATRIX } from '@/lib/configMatrix';
import { renderMessagePlain } from '@/lib/notifications/templates';
import type {
  ZuperCategory,
  ZuperChecklist,
  ZuperNotification,
  ZuperWorkflowSummary,
} from '@/lib/zuper/transformer';
import { describeWorkflow } from '@/lib/zuper/workflowDescriptions';

const ORANGE = '#F97316';
const DARK   = '#1A1A1A';
const MUTED  = '#6B7280';
const FAINT  = '#9CA3AF';
const BG     = '#FAF9F7';
const BORDER = '#E5E2DC';

const s = StyleSheet.create({
  page:        { fontFamily: 'Helvetica', backgroundColor: BG, padding: 40 },
  cover:       { flex: 1, justifyContent: 'center' },
  eyebrow:     { fontSize: 8, fontWeight: 'bold', color: ORANGE, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  h1:          { fontSize: 26, fontWeight: 'bold', color: DARK, marginBottom: 6, lineHeight: 1.2 },
  h2:          { fontSize: 16, fontWeight: 'bold', color: DARK, marginBottom: 14 },
  h3:          { fontSize: 11, fontWeight: 'bold', color: DARK, marginBottom: 4 },
  body:        { fontSize: 9.5, color: MUTED, lineHeight: 1.45 },
  bodyDark:    { fontSize: 9.5, color: DARK, lineHeight: 1.45 },
  small:       { fontSize: 8.5, color: FAINT },
  label:       { fontSize: 7.5, fontWeight: 'bold', color: FAINT, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 },
  section:     { marginBottom: 22 },
  card:        { backgroundColor: '#FFFFFF', borderRadius: 6, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: BORDER },
  subCard:     { backgroundColor: BG, borderRadius: 5, padding: 8, marginBottom: 5, borderWidth: 1, borderColor: BORDER },
  row:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rowGap:      { flexDirection: 'row', gap: 16 },
  divider:     { borderBottomWidth: 1, borderBottomColor: BORDER, marginVertical: 14 },
  badge:       { fontSize: 7.5, fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12 },
  orangeBadge: { backgroundColor: '#FFF7ED', color: ORANGE },
  amberBadge:  { backgroundColor: '#FFFBEB', color: '#B45309' },
  blueBadge:   { backgroundColor: '#EFF6FF', color: '#1D4ED8' },
  greenBadge:  { backgroundColor: '#F0FDF4', color: '#16A34A' },
  greyBadge:   { backgroundColor: '#F3F4F6', color: MUTED },
  bullet:      { fontSize: 9.5, color: MUTED, lineHeight: 1.45 },
  requestCard: { backgroundColor: '#FFFBEB', borderRadius: 6, padding: 10, marginBottom: 5, borderWidth: 1, borderColor: '#FDE68A' },
  renameRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  strike:      { fontSize: 9, color: FAINT, textDecoration: 'line-through' },
  flowImage:   { width: '100%', maxHeight: 600, objectFit: 'contain' },
  flowLink:    { backgroundColor: '#FFF7ED', borderRadius: 6, padding: 14, borderWidth: 1, borderColor: '#FED7AA', marginTop: 8 },
  flowLinkText:{ fontSize: 11, fontWeight: 'bold', color: ORANGE },
  flowLinkUrl: { fontSize: 8.5, color: MUTED, marginTop: 4 },
  footer:      { position: 'absolute', bottom: 24, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});

interface SectionHeaderProps { number: string | number; title: string }
function SectionHeader({ number, title }: SectionHeaderProps) {
  return (
    <>
      <Text style={s.eyebrow}>Section {number}</Text>
      <Text style={s.h2}>{title}</Text>
    </>
  );
}

function Footer({ orgName, page }: { orgName: string; page: number }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.small}>{orgName} — Onboarding Report</Text>
      <Text style={s.small}>Page {page}</Text>
    </View>
  );
}

interface RenameMap { [uid: string]: { newName: string; originalName: string } }

interface ReportProps {
  orgName: string;
  customerName: string;
  saEmail: string;
  customerEmail: string;
  answers: Record<string, any>;
  changeRequests: Record<string, string>;
  submittedAt: string;
  snapshot: {
    categories?: ZuperCategory[];
    checklists?: ZuperChecklist[];
    notifications?: ZuperNotification[];
    workflows?: ZuperWorkflowSummary[];
  } | null;
  wizardUrl: string;
}

export function OnboardingReport({
  orgName,
  customerName,
  saEmail,
  customerEmail,
  answers,
  changeRequests,
  submittedAt,
  snapshot,
  wizardUrl,
}: ReportProps) {
  const date = new Date(submittedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  // Renames pulled from the merged answers map
  const categoryRenames: RenameMap = {};
  const statusRenames: RenameMap = {};
  for (const [key, value] of Object.entries(answers)) {
    if (!key.startsWith('__rename:')) continue;
    if (!value || typeof value !== 'object') continue;
    const v = value as { newName?: string; originalName?: string };
    if (!v.newName || !v.originalName) continue;
    if (key.startsWith('__rename:category:')) {
      categoryRenames[key.slice('__rename:category:'.length)] = { newName: v.newName, originalName: v.originalName };
    } else if (key.startsWith('__rename:status:')) {
      statusRenames[key.slice('__rename:status:'.length)] = { newName: v.newName, originalName: v.originalName };
    }
  }

  // Discovery answers via shared formatter (labels, dynamic options,
  // file uploads, "Other" free text). Reserved __ keys are skipped.
  const answeredQuestions = getAnsweredQuestions(answers).map(({ question, display }) => ({
    section: question.section,
    question: question.text,
    answer: display,
  }));

  const answersBySection = SECTIONS
    .map((sec) => ({ section: sec, items: answeredQuestions.filter((qa) => qa.section === sec.id) }))
    .filter((g) => g.items.length > 0);

  const activeChangeRequests = CONFIG_MATRIX
    .filter((m) => changeRequests[m.module]?.trim())
    .map((m) => ({ label: m.label, text: changeRequests[m.module] }));

  const categories       = snapshot?.categories ?? [];
  const checklists       = (snapshot?.checklists ?? []).filter((c) => c.items.length > 0);
  const liveNotifs       = (snapshot?.notifications ?? []).filter((n) => n.isActive);
  const activeWorkflows  = (snapshot?.workflows ?? []).filter((w) => w.isActive);
  const selectedBrands: string[] = Array.isArray(answers['brands'])
    ? answers['brands'].filter((b: string) => b !== 'other')
    : [];

  const renameSummary: Array<{ kind: string; original: string; updated: string }> = [
    ...Object.values(categoryRenames).map((r) => ({ kind: 'Category', original: r.originalName, updated: r.newName })),
    ...Object.values(statusRenames).map((r) => ({ kind: 'Status', original: r.originalName, updated: r.newName })),
  ];

  return (
    <Document title={`${orgName} — Onboarding Report`} author="Zuper Onboarding Compass">

      {/* ── Cover ─────────────────────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <View style={s.cover}>
          <Text style={s.eyebrow}>Onboarding Configuration Report</Text>
          <Text style={s.h1}>{orgName}</Text>
          <Text style={[s.body, { marginBottom: 4 }]}>Prepared with {customerName}</Text>
          <Text style={s.small}>Submitted {date}</Text>
          <View style={s.divider} />
          <View style={s.rowGap}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>SA / BA</Text>
              <Text style={s.body}>{saEmail || 'onboarding@zuper.co'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Customer</Text>
              <Text style={s.body}>{customerEmail || '—'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Questions answered</Text>
              <Text style={s.body}>{answeredQuestions.length}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Change requests</Text>
              <Text style={s.body}>{activeChangeRequests.length}</Text>
            </View>
          </View>
        </View>
        <Footer orgName={orgName} page={1} />
      </Page>

      {/* ── Discovery answers ─────────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <SectionHeader number={1} title="Discovery answers" />
        {answersBySection.length === 0 && (
          <Text style={s.body}>No answers were submitted.</Text>
        )}
        {answersBySection.map((group, i) => (
          <View key={i} style={s.section} wrap={false}>
            <Text style={[s.label, { color: ORANGE, marginBottom: 6 }]}>{group.section.label}</Text>
            {group.items.map((qa, j) => (
              <View key={j} style={s.card}>
                <Text style={s.label}>{qa.question}</Text>
                <Text style={[s.bodyDark, { marginTop: 2 }]}>{qa.answer}</Text>
              </View>
            ))}
          </View>
        ))}
        <Footer orgName={orgName} page={2} />
      </Page>

      {/* ── Flow diagram ──────────────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <SectionHeader number={2} title="Your flow" />
        <Text style={[s.body, { marginBottom: 12 }]}>
          {`How ${orgName}'s jobs will move through Zuper. Open the link below to view the live interactive flow diagram.`}
        </Text>
        <Link src={wizardUrl} style={s.flowLink}>
          <Text style={s.flowLinkText}>View your Zuper workflow →</Text>
          <Text style={s.flowLinkUrl}>{wizardUrl}</Text>
        </Link>
        <Footer orgName={orgName} page={3} />
      </Page>

      {/* ── Findings: live account ────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <SectionHeader number={3} title="Findings: your live Zuper account" />

        {/* Categories */}
        <View style={s.section}>
          <Text style={[s.h3, { marginBottom: 6 }]}>Categories ({categories.length})</Text>
          {categories.length === 0 ? (
            <Text style={s.body}>No categories found.</Text>
          ) : (
            categories.map((cat) => {
              const rename = categoryRenames[cat.uid];
              const label = rename?.newName ?? cat.name;
              return (
                <View key={cat.uid} style={rename ? s.requestCard : s.subCard}>
                  <View style={s.row}>
                    <View style={{ flex: 1 }}>
                      {rename ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={[s.bodyDark, { color: FAINT }]}>{rename.originalName}</Text>
                          <Text style={[s.body, { marginHorizontal: 5 }]}>→</Text>
                          <Text style={s.bodyDark}>{label}</Text>
                          <View style={{ marginLeft: 6 }}>
                            <Text style={[s.badge, s.amberBadge]}>Renamed</Text>
                          </View>
                        </View>
                      ) : (
                        <Text style={s.bodyDark}>{label}</Text>
                      )}
                    </View>
                    <Text style={s.small}>{cat.statuses.length} status{cat.statuses.length !== 1 ? 'es' : ''}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Statuses */}
        <View style={s.section}>
          <Text style={[s.h3, { marginBottom: 6 }]}>Statuses</Text>
          {categories.filter((c) => c.statuses.length > 0).map((cat) => {
            const catLabel = categoryRenames[cat.uid]?.newName ?? cat.name;
            return (
              <View key={cat.uid} style={{ marginBottom: 8 }} wrap={false}>
                <Text style={[s.label, { marginBottom: 4 }]}>{catLabel}</Text>
                {cat.statuses.map((st) => {
                  const rename = statusRenames[st.uid];
                  const label = rename?.newName ?? st.name;
                  return (
                    <View key={st.uid} style={rename ? [s.requestCard, { paddingVertical: 6 }] : [s.subCard, { paddingVertical: 5 }]}>
                      {rename ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={[s.bodyDark, { color: FAINT }]}>{rename.originalName}</Text>
                          <Text style={[s.body, { marginHorizontal: 5 }]}>→</Text>
                          <Text style={s.bodyDark}>{label}</Text>
                          <View style={{ marginLeft: 6 }}>
                            <Text style={[s.badge, s.amberBadge]}>Renamed</Text>
                          </View>
                        </View>
                      ) : (
                        <Text style={s.bodyDark}>{label}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>

        <Footer orgName={orgName} page={4} />
      </Page>

      {/* ── Checklists ────────────────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <SectionHeader number={4} title="Checklists per category" />
        {checklists.length === 0 ? (
          <Text style={s.body}>No checklist items configured.</Text>
        ) : (
          checklists.map((cl) => (
            <View key={cl.categoryUid} style={s.section} wrap={false}>
              <Text style={[s.h3, { marginBottom: 4 }]}>{categoryRenames[cl.categoryUid]?.newName ?? cl.categoryName}</Text>
              <Text style={[s.small, { marginBottom: 6 }]}>{cl.items.length} field{cl.items.length !== 1 ? 's' : ''}</Text>
              {cl.items.map((item) => (
                <View key={item.uid} style={[s.subCard, { paddingVertical: 6 }]}>
                  <Text style={s.bodyDark}>
                    {item.label}{item.isRequired ? ' *' : ''}
                  </Text>
                  <Text style={s.small}>{item.type}</Text>
                </View>
              ))}
            </View>
          ))
        )}
        <Footer orgName={orgName} page={5} />
      </Page>

      {/* ── Notifications (active only) ───────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <SectionHeader number={5} title="Active customer notifications" />
        {liveNotifs.length === 0 ? (
          <Text style={s.body}>No active notifications configured.</Text>
        ) : (
          liveNotifs.map((n) => (
            <View key={n.uid} style={s.card} wrap={false}>
              <View style={[s.row, { marginBottom: 4 }]}>
                <Text style={s.bodyDark}>{n.name}</Text>
                <Text style={[s.badge, n.type === 'SMS' ? { backgroundColor: '#FAF5FF', color: '#7C3AED' } : s.blueBadge]}>
                  {n.type}
                </Text>
              </View>
              <Text style={s.small}>
                {n.categoryName}{n.statusName ? ` · ${n.statusName}` : ''}
              </Text>
              {n.emailSubject && (
                <Text style={[s.bodyDark, { marginTop: 4, fontSize: 9 }]}>Subject: {n.emailSubject}</Text>
              )}
              {(n as any).message && (
                <Text style={[s.body, { marginTop: 3 }]} >{renderMessagePlain((n as any).message)}</Text>
              )}
            </View>
          ))
        )}
        <Footer orgName={orgName} page={6} />
      </Page>

      {/* ── Workflows ─────────────────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <SectionHeader number={6} title="Active automations" />
        {activeWorkflows.length === 0 ? (
          <Text style={s.body}>No active automations.</Text>
        ) : (
          activeWorkflows.map((wf) => {
            const wfDescription = describeWorkflow(wf);
            return (
              <View key={wf.uid} style={s.card} wrap={false}>
                <Text style={s.bodyDark}>{wf.name}</Text>
                <Text style={[s.small, { marginTop: 1 }]}>
                  Trigger: {wf.trigger} · {wf.nodeCount} node{wf.nodeCount !== 1 ? 's' : ''}
                </Text>
                {wfDescription ? (
                  <Text style={[s.body, { marginTop: 4 }]}>{wfDescription}</Text>
                ) : (
                  <Text style={[s.small, { marginTop: 4, fontStyle: 'italic' }]}>No description set in Zuper.</Text>
                )}
              </View>
            );
          })
        )}
        <Footer orgName={orgName} page={7} />
      </Page>

      {/* ── Proposals (CPQ) ───────────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <SectionHeader number={7} title="Proposals (CPQ)" />
        {selectedBrands.length === 0 ? (
          <Text style={s.body}>No roofing brands selected.</Text>
        ) : (
          <>
            <Text style={[s.body, { marginBottom: 10 }]}>
              Good / Better / Best proposal structure to build in Zuper CPQ per selected brand.
            </Text>
            {selectedBrands.map((b) => (
              <View key={b} style={s.subCard} wrap={false}>
                <Text style={s.bodyDark}>{b.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</Text>
                <Text style={s.small}>Good · Better · Best tiers to be set up</Text>
              </View>
            ))}
          </>
        )}
        <Footer orgName={orgName} page={8} />
      </Page>

      {/* ── Renames + change requests ─────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <SectionHeader number={8} title="Renames & change requests" />

        <Text style={[s.h3, { marginBottom: 4 }]}>Inline renames ({renameSummary.length})</Text>
        {renameSummary.length === 0 ? (
          <Text style={[s.body, { marginBottom: 14 }]}>No renames.</Text>
        ) : (
          renameSummary.map((r, i) => (
            <View key={i} style={[s.requestCard, s.renameRow]}>
              <Text style={[s.badge, s.amberBadge, { marginRight: 8 }]}>{r.kind}</Text>
              <Text style={[s.bodyDark, { color: FAINT }]}>{r.original}</Text>
              <Text style={[s.body, { marginHorizontal: 6 }]}>→</Text>
              <Text style={s.bodyDark}>{r.updated}</Text>
            </View>
          ))
        )}

        <View style={{ height: 12 }} />
        <Text style={[s.h3, { marginBottom: 4 }]}>Change requests ({activeChangeRequests.length})</Text>
        {activeChangeRequests.length === 0 ? (
          <Text style={s.body}>None — defaults will be configured as standard.</Text>
        ) : (
          activeChangeRequests.map((cr, i) => (
            <View key={i} style={s.requestCard} wrap={false}>
              <View style={[s.row, { marginBottom: 4 }]}>
                <Text style={s.label}>{cr.label}</Text>
                <Text style={[s.badge, s.amberBadge]}>Change request</Text>
              </View>
              <Text style={s.body}>{cr.text}</Text>
            </View>
          ))
        )}

        <View style={s.divider} />
        <Text style={s.body}>
          Questions about anything in this report? Reach out to{' '}
          {saEmail ? `${saEmail} (CC onboarding@zuper.co)` : 'onboarding@zuper.co'}.
        </Text>

        <Footer orgName={orgName} page={9} />
      </Page>
    </Document>
  );
}
