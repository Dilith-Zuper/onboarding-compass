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

const RECIPIENT_LABEL: Record<string, string> = {
  owner:           'Owner',
  sales_rep:       'Sales rep',
  office_manager:  'Office manager',
  project_manager: 'Project manager',
  bookkeeper:      'Bookkeeper',
};

function joinRecipients(values: string[] | undefined): string {
  if (!values || values.length === 0) return 'Configured user';
  return values.map((v) => RECIPIENT_LABEL[v] || v).join(', ');
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

  // ── Pre-install reminders ─────────────────────────────────────────────────
  const reminders = answers['pre_install_reminders'];
  if (reminders === 'both' || reminders === 'homeowners_only') {
    out.push({
      id: 'pre_install_reminder_homeowner',
      nodeId: 'production',
      title: 'Pre-install reminder to homeowner',
      trigger: '24 hours before the scheduled install',
      audience: 'homeowner',
      channel: 'mixed',
      description: 'Reminder with date, time, and crew arrival window.',
      source: 'answers',
    });
  }
  if (reminders === 'both' || reminders === 'crews_only') {
    out.push({
      id: 'pre_install_reminder_crew',
      nodeId: 'production',
      title: 'Pre-install reminder to crew',
      trigger: 'Day before install',
      audience: 'crew',
      channel: 'mixed',
      description: 'Sends job details, address, and homeowner contact to the assigned crew.',
      source: 'answers',
    });
  }

  // ── Pre-job documents ─────────────────────────────────────────────────────
  if (answers['sends_pre_job_docs'] === 'yes') {
    const what = answers['pre_job_docs_what'];
    out.push({
      id: 'pre_job_docs',
      nodeId: 'production',
      title: 'Pre-job documents to homeowner',
      trigger: 'Once the install is scheduled',
      audience: 'homeowner',
      channel: 'email',
      description: what ? `Includes: ${String(what).slice(0, 160)}` : 'Documents sent to homeowner before install.',
      source: 'answers',
    });
  }

  // ── Post-job documents (each one becomes its own notification) ────────────
  if (answers['sends_post_job_docs'] === 'yes') {
    const items: string[] = Array.isArray(answers['post_job_docs_what']) ? answers['post_job_docs_what'] : [];
    for (const item of items) {
      if (item === 'other') continue;
      const d = POST_JOB_DOC_DETAILS[item];
      if (!d) continue;
      out.push({
        id: `post_job_${item}`,
        nodeId: 'complete',
        title: d.title,
        trigger: 'On job completion',
        audience: 'homeowner',
        channel: d.channel,
        description: d.description,
        source: 'answers',
      });
    }
  }

  // ── Payment received notification ─────────────────────────────────────────
  const payRecipients: string[] = Array.isArray(answers['payment_notification_recipients'])
    ? answers['payment_notification_recipients']
    : [];
  if (payRecipients.length > 0) {
    out.push({
      id: 'payment_received',
      nodeId: 'invoicing',
      title: 'Payment received',
      trigger: 'When a payment is recorded against an invoice',
      audience: 'specific',
      audienceLabel: joinRecipients(payRecipients),
      channel: 'in_app',
      description: 'Internal notification confirming payment was received.',
      source: 'answers',
    });
  }

  // ── Payment failure alert ─────────────────────────────────────────────────
  const failRecipients: string[] = Array.isArray(answers['payment_failure_recipients'])
    ? answers['payment_failure_recipients']
    : [];
  if (failRecipients.length > 0) {
    out.push({
      id: 'payment_failed',
      nodeId: 'invoicing',
      title: 'Payment failed alert',
      trigger: 'When a payment fails, bounces, or is declined',
      audience: 'specific',
      audienceLabel: joinRecipients(failRecipients),
      channel: 'push',
      description: 'Urgent alert to recover the payment immediately.',
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
