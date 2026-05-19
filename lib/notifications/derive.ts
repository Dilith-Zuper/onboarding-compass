export type NotifAudience = 'homeowner' | 'crew' | 'office' | 'sales' | 'specific';
export type NotifChannel  = 'sms' | 'email' | 'push' | 'in_app' | 'mixed';

export interface DerivedNotification {
  id: string;
  nodeId: string;            // flow node where this fires
  title: string;
  trigger: string;
  audience: NotifAudience;
  audienceLabel?: string;
  channel: NotifChannel;
  description: string;
  source: 'answers' | 'default';
}

const POST_JOB_DOC_DETAILS: Record<string, { title: string; channel: NotifChannel; description: string }> = {
  certificate:    { title: 'Certificate of completion', channel: 'email', description: 'Formal completion certificate emailed to the homeowner.' },
  warranty:       { title: 'Warranty documents',        channel: 'email', description: 'Manufacturer and workmanship warranty docs.' },
  final_invoice:  { title: 'Final paid invoice',        channel: 'email', description: 'Paid invoice with breakdown and receipt.' },
  photos:         { title: 'Completion photos',         channel: 'email', description: 'Final job photos shared with the homeowner.' },
  review_request: { title: 'Review request',            channel: 'mixed', description: 'Automated review request via SMS or email.' },
};

export function deriveNotificationsFromAnswers(answers: Record<string, any>): DerivedNotification[] {
  const out: DerivedNotification[] = [];

  // ── Website widget ────────────────────────────────────────────────────────
  if (answers['wants_booking_widget'] === 'yes') {
    out.push({
      id: 'widget_submission_ack',
      nodeId: 'website_lead',
      title: 'Booking submission confirmation',
      trigger: 'Customer submits the website form',
      audience: 'homeowner',
      channel: 'email',
      description: 'Auto-confirmation to the homeowner acknowledging their submission.',
      source: 'answers',
    });
  }

  // ── SLA breach notification ────────────────────────────────────────────────
  if (answers['wants_sla_notification'] === 'yes') {
    out.push({
      id: 'sla_breach_push',
      nodeId: 'lead_qualification',
      title: '5-min SLA breach alert',
      trigger: "Lead not contacted within 5 minutes of creation",
      audience: 'specific',
      audienceLabel: answers['sla_notification_recipient'] || 'Configured user',
      channel: 'push',
      description: 'Push notification fires when speed-to-lead window is missed.',
      source: 'answers',
    });
  }

  // ── Post-job documents (each one becomes its own notification) ────────────
  const postJobItems: string[] = Array.isArray(answers['post_job_docs_what']) ? answers['post_job_docs_what'] : [];
  for (const item of postJobItems) {
    if (item === 'other') continue;
    const d = POST_JOB_DOC_DETAILS[item];
    if (!d) continue;
    out.push({
      id: `post_job_${item}`,
      nodeId: 'invoicing',
      title: d.title,
      trigger: 'On job completion',
      audience: 'homeowner',
      channel: d.channel,
      description: d.description,
      source: 'answers',
    });
  }

  return out;
}

/**
 * Notifications that fire by default for every account — regardless of answers.
 * Some are gated on whether a particular flow node exists.
 */
export function getAlwaysOnNotifications(answers: Record<string, any>): DerivedNotification[] {
  const out: DerivedNotification[] = [];
  const hasLQ = answers['has_lead_qualification'] === 'yes';
  const hasWidget = answers['wants_booking_widget'] === 'yes';

  if (hasLQ) {
    out.push({
      id: 'default_sla_flag',
      nodeId: 'lead_qualification',
      title: 'Lead delayed flag (5-min SLA)',
      trigger: '5 minutes after lead creation if status is still New Lead',
      audience: 'office',
      channel: 'in_app',
      description: 'Native Zuper job delay indicator appears on the lead — always on.',
      source: 'default',
    });
  }

  if (hasWidget) {
    out.push({
      id: 'default_contact_created',
      nodeId: 'lead_in',
      title: 'Contact + job auto-created',
      trigger: 'On widget submission',
      audience: 'office',
      channel: 'in_app',
      description: 'Customer record and job are created in Zuper automatically — visible in Jobs list.',
      source: 'default',
    });
  }

  out.push({
    id: 'default_tech_assignment',
    nodeId: 'inspection',
    title: 'Tech assignment notification',
    trigger: 'When a job is assigned to a technician',
    audience: 'crew',
    channel: 'push',
    description: 'Assigned tech receives a push with job details on their Zuper mobile app.',
    source: 'default',
  });

  out.push({
    id: 'default_status_emails',
    nodeId: 'inspection',
    title: 'Status-change customer notifications',
    trigger: 'When a job moves between configured statuses',
    audience: 'homeowner',
    channel: 'email',
    description: 'Per-status customer notifications configured in Zuper — see the Notifications module for the full list.',
    source: 'default',
  });

  return out;
}

/**
 * Group derived notifications by flow node id.
 */
export function groupNotificationsByNode(
  notifications: DerivedNotification[]
): Record<string, DerivedNotification[]> {
  const out: Record<string, DerivedNotification[]> = {};
  for (const n of notifications) {
    if (!out[n.nodeId]) out[n.nodeId] = [];
    out[n.nodeId].push(n);
  }
  return out;
}

// ── Display helpers ──────────────────────────────────────────────────────────

export const CHANNEL_LABEL: Record<NotifChannel, string> = {
  sms:    'SMS',
  email:  'Email',
  push:   'Push',
  in_app: 'In-app',
  mixed:  'SMS + Email',
};

export const AUDIENCE_LABEL: Record<NotifAudience, string> = {
  homeowner: 'Homeowner',
  crew:      'Crew',
  office:    'Office team',
  sales:     'Sales',
  specific:  'Specific person',
};
