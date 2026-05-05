import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { QUESTIONS } from '@/lib/questions';
import { CONFIG_MATRIX } from '@/lib/configMatrix';

const ORANGE = '#F97316';
const DARK   = '#1A1A1A';
const MUTED  = '#6B7280';
const BG     = '#FAF9F7';
const BORDER = '#E5E2DC';

const s = StyleSheet.create({
  page:         { fontFamily: 'Helvetica', backgroundColor: BG, padding: 48 },
  cover:        { flex: 1, justifyContent: 'center' },
  eyebrow:      { fontSize: 9, fontWeight: 'bold', color: ORANGE, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  h1:           { fontSize: 28, fontWeight: 'bold', color: DARK, marginBottom: 6, lineHeight: 1.2 },
  h2:           { fontSize: 16, fontWeight: 'bold', color: DARK, marginBottom: 12 },
  h3:           { fontSize: 11, fontWeight: 'bold', color: DARK, marginBottom: 6 },
  body:         { fontSize: 10, color: MUTED, lineHeight: 1.5 },
  small:        { fontSize: 9,  color: MUTED },
  label:        { fontSize: 8,  fontWeight: 'bold', color: MUTED, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 },
  section:      { marginBottom: 28 },
  card:         { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: BORDER },
  row:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  divider:      { borderBottomWidth: 1, borderBottomColor: BORDER, marginVertical: 16 },
  badge:        { fontSize: 8, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  orangeBadge:  { backgroundColor: '#FFF7ED', color: ORANGE },
  amberBadge:   { backgroundColor: '#FFFBEB', color: '#B45309' },
  requestCard:  { backgroundColor: '#FFFBEB', borderRadius: 8, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: '#FDE68A' },
  footer:       { position: 'absolute', bottom: 32, left: 48, right: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});

function Label({ children }: { children: string }) {
  return <Text style={s.label}>{children}</Text>;
}

interface ReportProps {
  orgName: string;
  customerName: string;
  saEmail: string;
  answers: Record<string, any>;
  changeRequests: Record<string, string>;
  submittedAt: string;
}

export function OnboardingReport({
  orgName, customerName, saEmail, answers, changeRequests, submittedAt,
}: ReportProps) {
  const date = new Date(submittedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  // Map question IDs to human-readable answers
  const answeredQuestions = QUESTIONS
    .filter((q) => answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== '')
    .map((q) => {
      const raw = answers[q.id];
      let display: string;
      if (Array.isArray(raw)) {
        const optionLabels = (q.options ?? []).reduce<Record<string, string>>((acc, o) => {
          acc[o.value] = o.label;
          return acc;
        }, {});
        display = raw.map((v) => optionLabels[v] || v).join(', ');
      } else if (q.options) {
        const opt = (q.options ?? []).find((o) => o.value === raw);
        display = opt?.label || raw;
      } else {
        display = String(raw);
      }
      return { question: q.text, answer: display };
    });

  const activeChangeRequests = CONFIG_MATRIX
    .filter((m) => changeRequests[m.module]?.trim())
    .map((m) => ({ label: m.label, text: changeRequests[m.module] }));

  return (
    <Document title={`${orgName} — Onboarding Report`} author="Zuper Onboarding Compass">
      {/* Cover page */}
      <Page size="A4" style={s.page}>
        <View style={s.cover}>
          <Text style={s.eyebrow}>Onboarding Configuration Report</Text>
          <Text style={s.h1}>{orgName}</Text>
          <Text style={[s.body, { marginBottom: 4 }]}>Prepared for {customerName}</Text>
          <Text style={s.small}>{date}</Text>
          <View style={s.divider} />
          <View style={s.row}>
            <View>
              <Label>SA / BA</Label>
              <Text style={s.body}>{saEmail}</Text>
            </View>
            <View>
              <Label>Total change requests</Label>
              <Text style={s.body}>{activeChangeRequests.length}</Text>
            </View>
            <View>
              <Label>Questions answered</Label>
              <Text style={s.body}>{answeredQuestions.length}</Text>
            </View>
          </View>
        </View>
        <View style={s.footer}>
          <Text style={s.small}>Zuper Onboarding Compass</Text>
          <Text style={s.small}>Confidential</Text>
        </View>
      </Page>

      {/* Discovery answers */}
      <Page size="A4" style={s.page}>
        <Text style={s.eyebrow}>Section 1</Text>
        <Text style={[s.h2, { marginBottom: 16 }]}>Discovery answers</Text>

        {answeredQuestions.map((qa, i) => (
          <View key={i} style={s.card}>
            <Text style={s.label}>{qa.question}</Text>
            <Text style={[s.body, { marginTop: 2 }]}>{qa.answer}</Text>
          </View>
        ))}

        <View style={s.footer}>
          <Text style={s.small}>{orgName} — Onboarding Report</Text>
          <Text style={s.small}>Page 2</Text>
        </View>
      </Page>

      {/* Change requests */}
      <Page size="A4" style={s.page}>
        <Text style={s.eyebrow}>Section 2</Text>
        <Text style={[s.h2, { marginBottom: 16 }]}>Change requests</Text>

        {activeChangeRequests.length === 0 ? (
          <Text style={s.body}>No change requests submitted.</Text>
        ) : (
          activeChangeRequests.map((cr, i) => (
            <View key={i} style={s.requestCard}>
              <View style={[s.row, { marginBottom: 6 }]}>
                <Text style={s.label}>{cr.label}</Text>
                <Text style={[s.badge, s.amberBadge]}>Change request</Text>
              </View>
              <Text style={s.body}>{cr.text}</Text>
            </View>
          ))
        )}

        <View style={s.footer}>
          <Text style={s.small}>{orgName} — Onboarding Report</Text>
          <Text style={s.small}>Page 3</Text>
        </View>
      </Page>
    </Document>
  );
}
