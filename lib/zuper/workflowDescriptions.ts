import type { ZuperWorkflowSummary } from './transformer';

/**
 * Curated plain-English copy for the GA (golden account) workflows that get
 * cloned into every new roofing customer account. Keyed by normalized
 * workflow name so punctuation/quote/spacing variants still match.
 *
 * Workflows added later that aren't in this map fall back to whatever
 * description is set in Zuper (or the "no description" note) and land in the
 * "More automations" group.
 */

export type WorkflowStage =
  | 'lead_intake'
  | 'lead_followup'
  | 'scheduling'
  | 'quotes'
  | 'production'
  | 'communication'
  | 'other';

export const WORKFLOW_STAGE_ORDER: WorkflowStage[] = [
  'lead_intake',
  'lead_followup',
  'scheduling',
  'quotes',
  'production',
  'communication',
  'other',
];

export const WORKFLOW_STAGE_LABELS: Record<WorkflowStage, string> = {
  lead_intake:   'Getting leads in',
  lead_followup: 'Following up on leads',
  scheduling:    'Scheduling & job tracking',
  quotes:        'Quotes & proposals',
  production:    'Production',
  communication: 'Calls, texts & email',
  other:         'More automations',
};

/** Lowercase and strip all punctuation so name variants normalize to one key. */
export function normalizeWorkflowName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

interface GaWorkflowInfo {
  stage: WorkflowStage;
  description: string;
}

const GA_WORKFLOWS: Record<string, GaWorkflowInfo> = {
  // ── Getting leads in ───────────────────────────────────────────────────────
  'lead intake from various sources and create customer and jobs': {
    stage: 'lead_intake',
    description:
      'Receives new leads from Angi, Thumbtack, Google LSA, and Meta the moment they come in, creates the customer record, and opens a Lead Qualification job automatically — no manual data entry.',
  },
  'generic all source lead creation': {
    stage: 'lead_intake',
    description:
      'Catch-all intake for any other lead source — submissions hit a webhook and a lead is created in Zuper automatically.',
  },
  'angie s list to zuper lead': {
    stage: 'lead_intake',
    description:
      'Legacy Angi intake — creates a lead in Zuper from an Angi (Angie\'s List) submission.',
  },
  'roofle mvp': {
    stage: 'lead_intake',
    description:
      'Connects your Roofle instant-quote widget to Zuper — when a homeowner requests a quote on your site, the customer and job are created automatically.',
  },
  'roofl add job card as attachment': {
    stage: 'lead_intake',
    description:
      'When a job comes in from Roofle, the Roofle job card is attached to the Zuper job so your team has the original quote details on hand.',
  },
  'create lead qualification job when a new customer is created': {
    stage: 'lead_intake',
    description:
      'The moment a new customer is created, a Lead Qualification job is opened so your sales team can make first contact within the 5-minute speed-to-lead window.',
  },
  'create project and inspection job from customer': {
    stage: 'lead_intake',
    description:
      'When a new customer is created, a project and an inspection job are set up automatically so the visit can be scheduled right away.',
  },
  'rg3 t72 create property and inspection job from customer address': {
    stage: 'lead_intake',
    description:
      'When a customer\'s address is added or updated, a property record and an inspection job are created for that address automatically.',
  },

  // ── Following up on leads ──────────────────────────────────────────────────
  'change lead to qualified based on checklist': {
    stage: 'lead_followup',
    description:
      'When the qualification checklist on a lead is completed with a positive outcome, the lead is marked qualified automatically — no separate status update needed.',
  },
  'lead qualification completed move to inspection': {
    stage: 'lead_followup',
    description:
      'When a lead is marked qualified, the next step is created automatically and the opportunity moves into inspection.',
  },
  'lead qualification job reschedule based on attempt status': {
    stage: 'lead_followup',
    description:
      'If a call attempt doesn\'t connect, the Lead Qualification job is rescheduled automatically for the next attempt so no lead is dropped.',
  },
  'jobs nurture drip campaign for lead qual jobs': {
    stage: 'lead_followup',
    description:
      'Automated follow-up sequence for open leads — scheduled texts and emails keep nurturing the lead until they respond or the job moves forward.',
  },
  'meta jobs nurture drip campaign for lead qual jobs': {
    stage: 'lead_followup',
    description:
      'Automated follow-up sequence for leads that came in from Meta ads — scheduled texts and emails keep nurturing the lead until they respond.',
  },
  'google lsa jobs nurture drip campaign for lead qual jobs': {
    stage: 'lead_followup',
    description:
      'Automated follow-up sequence for leads from Google Local Services Ads — scheduled texts and emails keep nurturing the lead until they respond.',
  },
  'angi jobs nurture drip campaign for lead qual jobs': {
    stage: 'lead_followup',
    description:
      'Automated follow-up sequence for leads from Angi — scheduled texts and emails keep nurturing the lead until they respond.',
  },
  'thumtack jobs nurture drip campaign for lead qual jobs': {
    stage: 'lead_followup',
    description:
      'Automated follow-up sequence for leads from Thumbtack — scheduled texts and emails keep nurturing the lead until they respond.',
  },

  // ── Scheduling & job tracking ──────────────────────────────────────────────
  'rg3 t55 upon job schedule update job status': {
    stage: 'scheduling',
    description:
      'When a job gets scheduled on the calendar, its status advances automatically so your dispatch board always reflects reality.',
  },
  'rg3 t55 upon job user assignment update job status': {
    stage: 'scheduling',
    description:
      'When a technician is assigned to a job, the job status updates automatically to show it\'s staffed.',
  },
  'create task on job creation': {
    stage: 'scheduling',
    description:
      'Every new job automatically gets its follow-up task created, so nothing depends on someone remembering to add it.',
  },
  'update status to on hold from job status checklist': {
    stage: 'scheduling',
    description:
      'If a status checklist indicates the job is waiting on something (customer, insurance, materials), the job is moved to On Hold automatically.',
  },
  'job status update to new job': {
    stage: 'scheduling',
    description:
      'When a job reaches a chosen status, the next job in your process is created automatically with the details carried over.',
  },

  // ── Quotes & proposals ─────────────────────────────────────────────────────
  'update consolidated quote on proposal update': {
    stage: 'quotes',
    description:
      'Whenever proposal options are edited, the project\'s consolidated quote is rebuilt so pricing always reflects the latest selections.',
  },
  'inspection project status update create consolidated quote for project': {
    stage: 'quotes',
    description:
      'After the inspection, updating the project status builds a consolidated quote for the project — combining the selected options into one document.',
  },
  'upload proposal attachment to quote and project': {
    stage: 'quotes',
    description:
      'When proposal options are edited, the latest proposal PDF is attached to both the quote and the project so everyone works from the current version.',
  },
  'quote acceptance follow ups drip campaign for sent quotes': {
    stage: 'quotes',
    description:
      'After a quote is sent, follow-up emails and texts go out automatically on day 2, 5, 10, 17, and 30 until the customer accepts or declines.',
  },
  'quote accept reject to job won lost': {
    stage: 'quotes',
    description:
      'When the customer accepts or rejects a quote, the job is marked Won or Lost to match — statuses never drift out of sync.',
  },
  'add line items from an accepted quote to job': {
    stage: 'quotes',
    description:
      'When a quote is accepted, its line items are copied onto the job so crews and invoices work from the sold scope.',
  },
  'job won to customer is lead no': {
    stage: 'quotes',
    description:
      'When a job is marked Won, the customer record is flipped from lead to customer automatically.',
  },

  // ── Production ─────────────────────────────────────────────────────────────
  'create production job on inspection approval': {
    stage: 'production',
    description:
      'When the proposal is approved, the production job is created automatically with details carried over from the inspection.',
  },
  'create next production job': {
    stage: 'production',
    description:
      'When one production phase completes, the next production job in the sequence is created automatically.',
  },
  'create repair job on proposal approval': {
    stage: 'production',
    description:
      'When a repair proposal is approved, a repair job is created and queued for scheduling automatically.',
  },
  'additional work order quote creation': {
    stage: 'production',
    description:
      'When extra work is discovered mid-job and the production job is flagged AWO, a draft quote is built automatically from the "Items required for AWO" checklist — ready to review and send.',
  },

  // ── Calls, texts & email ───────────────────────────────────────────────────
  'nova call ended update checklist workflow': {
    stage: 'communication',
    description:
      'When an inbound call ends, the call outcome is logged to the related job\'s checklist automatically — no manual note-taking.',
  },
  'inbound text message opt out workflow': {
    stage: 'communication',
    description:
      'If a customer texts STOP (or similar), they\'re marked as opted out and automated texts to them cease immediately.',
  },
  'unsubscribe email': {
    stage: 'communication',
    description:
      'When a customer clicks unsubscribe in an email, they\'re flagged as opted out so no further automated emails are sent to them.',
  },
};

/**
 * Best description for a workflow: curated GA copy first (customer-friendly),
 * then whatever description is set in Zuper, else null.
 */
export function describeWorkflow(wf: Pick<ZuperWorkflowSummary, 'name' | 'description'>): string | null {
  const curated = GA_WORKFLOWS[normalizeWorkflowName(wf.name)];
  if (curated) return curated.description;
  return wf.description || null;
}

/** Journey stage for grouping in the customer-facing automations module. */
export function workflowStage(wf: Pick<ZuperWorkflowSummary, 'name'>): WorkflowStage {
  return GA_WORKFLOWS[normalizeWorkflowName(wf.name)]?.stage ?? 'other';
}

/** Zuper trigger names → customer-readable "runs when" phrases. */
const TRIGGER_PHRASES: Record<string, string> = {
  'On Webhook':            'Runs when a lead arrives from an outside source',
  'On Schedule':           'Runs on a schedule',
  'On Job Status Update':  'Runs when a job changes status',
  'On Create Job':         'Runs when a job is created',
  'Schedule Job':          'Runs when a job is scheduled',
  'Assign Users':          'Runs when a technician is assigned',
  'New Customer':          'Runs when a new customer is created',
  'Customer Update':       'Runs when a customer record is updated',
  'Quote Update':          'Runs when a quote is edited',
  'Quote Status Update':   'Runs when a quote is sent, accepted, or rejected',
  'Update project status': 'Runs when a project changes status',
  'New Inbound Call':      'Runs when a call comes in',
  'Inbound text message':  'Runs when a text message comes in',
};

export function humanizeTrigger(trigger: string): string {
  return TRIGGER_PHRASES[trigger] ?? `Runs on: ${trigger}`;
}
