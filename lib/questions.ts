export type QuestionType =
  | 'single_select'
  | 'multi_select'
  | 'single_line'
  | 'multi_line'
  | 'card_select'
  | 'file_upload';

export interface QuestionCondition {
  questionId: string;
  answer: string | string[];
}

export interface Question {
  id: string;
  section: string;
  text: string;
  subtext?: string;
  conditionalSubtexts?: Array<{
    when: QuestionCondition[];
    text: string;
  }>;
  type: QuestionType;
  /** External link rendered as a button under the subtext (e.g. a form to fill). */
  link?: { url: string; label: string };
  options?: { value: string; label: string; icon?: string }[];
  /** If set, options are built from another question's selected answer values */
  optionsFromQuestion?: string;
  otherOption?: boolean;
  affectsFlow?: boolean;
  flowKey?: string;
  condition?: QuestionCondition;       // single condition
  conditions?: QuestionCondition[];    // ALL must match (AND logic)
  requiresSessionFlag?: string;
  required?: boolean;
}

export interface Section {
  id: string;
  label: string;
  description: string;
}

export const SECTIONS: Section[] = [
  { id: 'business_overview',     label: 'Business overview',         description: 'A quick snapshot of your work and where leads come from.' },
  { id: 'lead_flow',             label: 'Lead flow',                 description: 'How new opportunities come in and get qualified.' },
  { id: 'phone',                 label: 'Phone & calls',             description: 'Inbound calls and texts from customers.' },
  { id: 'website',               label: 'Website & online booking',  description: 'How homeowners reach you online.' },
  { id: 'measurement_estimation',label: 'Measurement & estimation',  description: 'How you measure, price, and present jobs.' },
  { id: 'crew_ops',              label: 'Crew & field ops',          description: 'How you staff jobs and coordinate the work.' },
  { id: 'payments',              label: 'Payments & invoicing',      description: 'How money moves between you and the customer.' },
  { id: 'closeout',              label: 'Closeout',                  description: 'How you wrap up a job after it\'s done.' },
  { id: 'open',                  label: 'Anything else',             description: 'Final notes before we move on.' },
];

export const QUESTIONS: Question[] = [

  // ─── BUSINESS OVERVIEW ───────────────────────────────────────────────────────

  {
    id: 'job_types',
    section: 'business_overview',
    text: 'What types of jobs make up most of your work?',
    subtext: 'Pick all that apply. We\'ll set up a job category for each.',
    type: 'multi_select',
    options: [
      { value: 'retail_residential', label: 'Retail / Residential' },
      { value: 'insurance_storm',    label: 'Insurance / Storm' },
      { value: 'commercial',         label: 'Commercial' },
      { value: 'multi_family_hoa',   label: 'Multi-family / HOA' },
    ],
    affectsFlow: true,
    flowKey: 'jobTypes',
    required: true,
  },

  {
    id: 'lead_sources',
    section: 'business_overview',
    text: 'Where do most of your leads come from today?',
    subtext: 'We\'ll set these up as Lead Source values in Zuper for attribution and reporting.',
    type: 'card_select',
    options: [
      { value: 'roofle',             label: 'Roofle' },
      { value: 'angi',               label: 'Angi (Angie\'s List)' },
      { value: 'phone_call',         label: 'Phone Call' },
      { value: 'meta_ads',           label: 'Meta Ads' },
      { value: 'google_lsa',         label: 'Google LSA' },
      { value: 'sales_rabbit',       label: 'Sales Rabbit' },
      { value: 'website',            label: 'Website' },
      { value: 'door_knocking',      label: 'Door Knocking' },
      { value: 'insurance_referral', label: 'Insurance Referral' },
      { value: 'billboard',          label: 'Billboard' },
      { value: 'google',             label: 'Google' },
      { value: 'facebook',           label: 'Facebook' },
      { value: 'call_in',            label: 'Call In' },
      { value: 'yard_sign',          label: 'Yard Sign' },
      { value: 'outbound',           label: 'Outbound' },
      { value: 'customer_referral',  label: 'Customer Referral' },
    ],
    otherOption: true,
    required: true,
  },

  // ─── LEAD FLOW ───────────────────────────────────────────────────────────────

  {
    id: 'has_lead_qualification',
    section: 'lead_flow',
    text: 'Do you have a lead qualification process today?',
    subtext: 'This is when someone checks if a new lead is worth pursuing before booking an inspection.',
    type: 'single_select',
    options: [
      { value: 'yes', label: 'Yes, we qualify leads before inspection' },
      { value: 'no',  label: 'No, we book inspections directly' },
    ],
    affectsFlow: true,
    flowKey: 'hasLeadQualification',
    required: true,
  },

  {
    id: 'qualification_platform',
    section: 'lead_flow',
    text: 'Where does lead qualification happen?',
    subtext: 'We recommend managing this inside Zuper for a unified workflow.',
    type: 'single_select',
    options: [
      { value: 'hubspot', label: 'In HubSpot (we manage leads there)' },
      { value: 'zuper',   label: 'In Zuper (recommended)' },
      { value: 'other',   label: 'Somewhere else' },
    ],
    affectsFlow: true,
    flowKey: 'qualificationPlatform',
    condition: { questionId: 'has_lead_qualification', answer: 'yes' },
    required: true,
  },

  {
    id: 'wants_sla_notification',
    section: 'lead_flow',
    text: 'Should we notify someone specific if a new lead isn\'t called within 5 minutes?',
    subtext:
      'All accounts have a 5-minute speed-to-lead SLA — the job gets flagged automatically when missed. Optionally, a specific person can also get a push notification.',
    type: 'single_select',
    options: [
      { value: 'yes', label: 'Yes, notify someone' },
      { value: 'no',  label: 'No, the flag on the job is enough' },
    ],
    conditions: [
      { questionId: 'has_lead_qualification', answer: 'yes' },
      { questionId: 'qualification_platform', answer: ['zuper', 'other'] },
    ],
    required: true,
  },
  {
    id: 'sla_notification_recipient',
    section: 'lead_flow',
    text: 'Who should we notify?',
    subtext: 'Their name or role — e.g. "Office Manager" or "Sarah Jones".',
    type: 'single_line',
    conditions: [
      { questionId: 'wants_sla_notification', answer: 'yes' },
    ],
    required: true,
  },

  // ─── PHONE & CALLS (Zuper Connect) ───────────────────────────────────────────

  {
    id: 'uses_zuper_connect',
    section: 'phone',
    text: 'You have Zuper Connect — would you like to activate it on this account?',
    subtext:
      'Zuper Connect gives your team a dedicated business number. Calls and texts from customers are automatically linked to their jobs.',
    type: 'single_select',
    options: [
      { value: 'yes',   label: 'Yes, set it up' },
      { value: 'later', label: 'Skip for now' },
    ],
    affectsFlow: true,
    flowKey: 'usesZuperConnect',
    requiresSessionFlag: 'hasZuperConnect',
    required: true,
  },

  {
    id: 'migrate_number',
    section: 'phone',
    text: 'Would you like to migrate your existing business number to Zuper Connect?',
    subtext: 'We can port your current number over so customers keep calling the same line.',
    type: 'single_select',
    options: [
      { value: 'yes', label: 'Yes, keep our existing number' },
      { value: 'no',  label: 'No, give us a new Zuper Connect number' },
    ],
    condition: { questionId: 'uses_zuper_connect', answer: 'yes' },
    requiresSessionFlag: 'hasZuperConnect',
    required: true,
  },

  {
    id: 'existing_number',
    section: 'phone',
    text: 'What\'s the business number you\'d like to keep?',
    subtext:
      'Include the area code — e.g. (555) 123-4567. We\'ll port this number over to Zuper so customers keep reaching you on the same line.',
    type: 'single_line',
    conditions: [
      { questionId: 'uses_zuper_connect', answer: 'yes' },
      { questionId: 'migrate_number', answer: 'yes' },
    ],
    requiresSessionFlag: 'hasZuperConnect',
    required: true,
  },

  {
    id: 'existing_number_provider',
    section: 'phone',
    text: 'Who is your current provider for that number?',
    subtext:
      'E.g. Verizon, AT&T, RingCentral, Grasshopper, Twilio. We need this to start the porting process with them.',
    type: 'single_line',
    conditions: [
      { questionId: 'uses_zuper_connect', answer: 'yes' },
      { questionId: 'migrate_number', answer: 'yes' },
    ],
    requiresSessionFlag: 'hasZuperConnect',
    required: true,
  },

  {
    id: 'tendlc_registration',
    section: 'phone',
    text: 'Have you submitted the 10DLC texting registration form?',
    subtext:
      'US carriers require every business texting customers to register their brand (A2P 10DLC). Without it, texts from your Zuper Connect number can be blocked. It takes about 5 minutes — please fill out the form below.',
    link: {
      url: 'https://forms.office.com/Pages/ResponsePage.aspx?id=zVrY5KOpT0-uUBhlmXUHywhxHbVEaHdCtTiq7y4_GDZURUxPME1KRFEyQk5ZU0VRWjIxRjA5R0k5VS4u',
      label: 'Open the 10DLC registration form',
    },
    type: 'single_select',
    options: [
      { value: 'submitted', label: 'Done — I\'ve submitted the form' },
      { value: 'later',     label: 'I\'ll complete it before our onboarding call' },
    ],
    condition: { questionId: 'uses_zuper_connect', answer: 'yes' },
    requiresSessionFlag: 'hasZuperConnect',
    required: true,
  },

  // ─── WEBSITE & ONLINE BOOKING ────────────────────────────────────────────────

  {
    id: 'wants_booking_widget',
    section: 'website',
    text: 'Would you like customers to be able to reach you or book online through your website?',
    subtext:
      'We can embed a booking form on your site. Customers fill in their details and an inspection job is created in Zuper automatically.',
    conditionalSubtexts: [
      {
        when: [
          { questionId: 'has_lead_qualification', answer: 'yes' },
          { questionId: 'qualification_platform', answer: 'hubspot' },
        ],
        text: "Since you manage leads in HubSpot, we'll set up a contact capture form on your site — details are collected and passed into HubSpot. No Zuper job is created from the form.",
      },
      {
        when: [
          { questionId: 'has_lead_qualification', answer: 'yes' },
          { questionId: 'qualification_platform', answer: ['zuper', 'other'] },
        ],
        text: "We'll set up a lead capture form. New website submissions create a contact and Lead Qualification job in Zuper automatically — entering your 5-minute speed-to-lead pipeline.",
      },
    ],
    type: 'single_select',
    options: [
      { value: 'yes', label: 'Yes, set up an online form' },
      { value: 'no',  label: 'No, we handle all requests by phone or email' },
    ],
    affectsFlow: true,
    flowKey: 'hasBookingWidget',
    required: true,
  },

  {
    id: 'booking_widget_scheduling',
    section: 'website',
    text: 'Can customers pick their own appointment slot when they book online?',
    subtext:
      'Since leads go directly to inspection, you can let customers self-schedule. Choose how much control to give them.',
    type: 'single_select',
    options: [
      { value: 'slot_and_tech',  label: 'Yes — pick a date, time, and technician' },
      { value: 'slot_only',      label: 'Yes — pick a date and time (we assign the technician)' },
      { value: 'no_scheduling',  label: "No — we'll call them to schedule after they submit" },
    ],
    conditions: [
      { questionId: 'wants_booking_widget', answer: 'yes' },
      { questionId: 'has_lead_qualification', answer: 'no' },
    ],
    required: true,
  },

  // ─── MEASUREMENT & ESTIMATION ────────────────────────────────────────────────

  {
    id: 'measurement_providers',
    section: 'measurement_estimation',
    text: 'Which measurement report providers do you currently use?',
    subtext: "We'll wire up integrations where possible so measurements flow into the job automatically.",
    type: 'multi_select',
    options: [
      { value: 'hover',           label: 'Hover' },
      { value: 'eagleview',       label: 'EagleView' },
      { value: 'roofscope',       label: 'Roofscope' },
      { value: 'gaf_quickmeasure',label: 'GAF QuickMeasure' },
      { value: 'roofr',           label: 'Roofr' },
      { value: 'manual',          label: 'We measure manually' },
    ],
    otherOption: true,
    required: true,
  },

  {
    id: 'proposal_method',
    section: 'measurement_estimation',
    text: 'How do you currently put together proposals for customers?',
    type: 'single_select',
    options: [
      { value: 'estimating_software', label: 'Estimating software' },
      { value: 'manual',              label: 'Manual / Excel / Word' },
      { value: 'handwritten',         label: 'Handwritten' },
      { value: 'no_formal',           label: "We don't send formal proposals" },
    ],
    required: true,
  },

  {
    id: 'proposal_software',
    section: 'measurement_estimation',
    text: 'Which estimating software do you use?',
    subtext: 'E.g. JobNimbus, AccuLynx, RoofSnap, ProLine, etc.',
    type: 'single_line',
    condition: { questionId: 'proposal_method', answer: 'estimating_software' },
    required: true,
  },

  {
    id: 'proposal_template_count',
    section: 'measurement_estimation',
    text: 'How many proposal templates are you working with?',
    type: 'single_select',
    options: [
      { value: '1_2',     label: '1 – 2' },
      { value: '3_5',     label: '3 – 5' },
      { value: '6_10',    label: '6 – 10' },
      { value: '10_plus', label: '10+' },
      { value: 'fresh',   label: 'None — we build each one fresh' },
    ],
    condition: { questionId: 'proposal_method', answer: 'estimating_software' },
  },

  {
    id: 'proposal_sample_upload',
    section: 'measurement_estimation',
    text: 'Can you upload a sample template you use now?',
    subtext: 'Helps us replicate your structure in Zuper CPQ. PDF, DOCX, or image — up to 10MB.',
    type: 'file_upload',
    condition: { questionId: 'proposal_method', answer: 'estimating_software' },
  },

  {
    id: 'material_pricing',
    section: 'measurement_estimation',
    text: 'How do you currently manage your material pricing?',
    type: 'single_select',
    options: [
      { value: 'live_feed',    label: 'Live feed from supplier' },
      { value: 'manual',       label: 'We update it manually' },
      { value: 'per_job',      label: 'We price each job individually' },
      { value: 'no_price_list',label: 'No formal price list' },
    ],
    required: true,
  },

  {
    id: 'suppliers',
    section: 'measurement_estimation',
    text: 'Which suppliers do you source materials from?',
    subtext: "We'll set up your vendor catalog and enable supplier integrations where available.",
    type: 'card_select',
    options: [
      { value: 'srs', label: 'SRS Distribution' },
      { value: 'abc', label: 'ABC Supply' },
      { value: 'qxo', label: 'QXO' },
    ],
    otherOption: true,
    required: true,
  },

  {
    id: 'brands',
    section: 'measurement_estimation',
    text: 'Which roofing brands do you work with?',
    subtext: "We'll set up a Good / Better / Best proposal structure for each brand you select.",
    type: 'card_select',
    options: [
      { value: 'gaf',           label: 'GAF' },
      { value: 'certainteed',   label: 'CertainTeed' },
      { value: 'owens_corning', label: 'Owens Corning' },
      { value: 'boral',         label: 'Boral' },
      { value: 'iko',           label: 'IKO' },
      { value: 'tamko',         label: 'TAMKO' },
      { value: 'atlas',         label: 'Atlas' },
      { value: 'decra',         label: 'Decra' },
      { value: 'malarkey',      label: 'Malarkey' },
      { value: 'topshield',     label: 'TopShield' },
      { value: 'berger',        label: 'Berger' },
      { value: 'carlisle',      label: 'Carlisle' },
    ],
    otherOption: true,
    required: true,
  },

  // ─── CREW & FIELD OPS ────────────────────────────────────────────────────────

  {
    id: 'staffing_model',
    section: 'crew_ops',
    text: 'How do you currently staff your jobs?',
    type: 'single_select',
    options: [
      { value: 'in_house',       label: 'All in-house' },
      { value: 'subcontractors', label: 'All subcontractors' },
      { value: 'mix',            label: 'Mix of both' },
    ],
    required: true,
  },


  {
    id: 'crew_briefing_info',
    section: 'crew_ops',
    text: 'What information do you share when briefing a crew?',
    subtext: 'Pick all that apply. This shapes the work order template.',
    type: 'multi_select',
    options: [
      { value: 'scope_materials',    label: 'Full scope + materials list' },
      { value: 'scope_only',         label: 'Scope only' },
      { value: 'pricing',            label: 'Pricing / cost details' },
      { value: 'special_instructions',label: 'Special homeowner instructions' },
      { value: 'nothing_structured', label: 'Nothing structured' },
    ],
  },

  // ─── PAYMENTS & INVOICING ────────────────────────────────────────────────────

  {
    id: 'payment_timing',
    section: 'payments',
    text: 'When do you typically collect payment from customers?',
    subtext: 'Pick all that apply.',
    type: 'multi_select',
    options: [
      { value: 'day_of_install', label: 'Day of install' },
      { value: 'few_days_after', label: 'Within a few days of completion' },
      { value: 'invoice_after',  label: 'Invoice sent after job is done' },
      { value: 'varies',         label: 'Varies by job type' },
    ],
    affectsFlow: true,
    flowKey: 'paymentTiming',
    required: true,
  },

  {
    id: 'collects_deposit',
    section: 'payments',
    text: 'Do you collect an upfront deposit or down payment?',
    type: 'single_select',
    options: [
      { value: 'never',     label: 'Never' },
      { value: 'sometimes', label: 'Sometimes — depends on the job' },
      { value: 'always',    label: 'Always' },
    ],
    required: true,
  },

  {
    id: 'deposit_job_types',
    section: 'payments',
    text: 'Which job types require a deposit?',
    subtext: 'Based on the job types you do.',
    type: 'multi_select',
    optionsFromQuestion: 'job_types',
    options: [
      { value: 'all', label: 'All jobs' },
    ],
    conditions: [
      { questionId: 'collects_deposit', answer: ['sometimes', 'always'] },
    ],
  },

  {
    id: 'payment_plans',
    section: 'payments',
    text: 'Do you offer payment plans or financing to customers?',
    type: 'single_select',
    options: [
      { value: 'yes',     label: 'Yes' },
      { value: 'no',      label: 'No' },
      { value: 'open_to', label: "Open to it but don't currently" },
    ],
    required: true,
  },

  // ─── CLOSEOUT ────────────────────────────────────────────────────────────────

  {
    id: 'post_job_docs_what',
    section: 'closeout',
    text: 'What do you send to customers after a job is complete?',
    subtext: 'Pick all that apply. Leave blank if you don\'t send anything today.',
    type: 'multi_select',
    options: [
      { value: 'certificate',    label: 'Certificate of completion' },
      { value: 'warranty',       label: 'Warranty docs' },
      { value: 'final_invoice',  label: 'Final paid invoice' },
      { value: 'photos',         label: 'Completion photos' },
      { value: 'review_request', label: 'Review request' },
    ],
    otherOption: true,
  },

  // ─── OPEN FIELD ──────────────────────────────────────────────────────────────

  {
    id: 'additional_notes',
    section: 'open',
    text: 'Anything about your current process we should know before we start?',
    subtext: 'Optional — any quirks, exceptions, or things we should account for.',
    type: 'multi_line',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function matchesCondition(cond: QuestionCondition, answers: Record<string, any>): boolean {
  const answer = answers[cond.questionId];
  if (answer === undefined || answer === null) return false;
  if (Array.isArray(cond.answer)) {
    return Array.isArray(answer)
      ? answer.some((a) => (cond.answer as string[]).includes(a))
      : (cond.answer as string[]).includes(answer);
  }
  return Array.isArray(answer) ? answer.includes(cond.answer) : answer === cond.answer;
}

export function getVisibleQuestions(
  answers: Record<string, any>,
  sessionFlags: Record<string, boolean> = {}
): Question[] {
  return QUESTIONS.filter((q) => {
    if (q.requiresSessionFlag && !sessionFlags[q.requiresSessionFlag]) return false;
    if (q.conditions) return q.conditions.every((c) => matchesCondition(c, answers));
    if (q.condition) return matchesCondition(q.condition, answers);
    return true;
  });
}

export function getEffectiveSubtext(q: Question, answers: Record<string, any>): string | undefined {
  if (q.conditionalSubtexts) {
    for (const entry of q.conditionalSubtexts) {
      if (entry.when.every((c) => matchesCondition(c, answers))) {
        return entry.text;
      }
    }
  }
  return q.subtext;
}

/**
 * Resolve dynamic options for questions that pull options from another question's answer.
 * Returns the merged option list (dynamic from source + any static options on this question).
 */
export function getEffectiveOptions(
  q: Question,
  answers: Record<string, any>
): { value: string; label: string }[] {
  if (!q.optionsFromQuestion) return q.options ?? [];
  const sourceQ = QUESTIONS.find((qq) => qq.id === q.optionsFromQuestion);
  const sourceAnswer = answers[q.optionsFromQuestion];
  if (!sourceQ || !Array.isArray(sourceAnswer)) return q.options ?? [];
  const labelByValue = new Map((sourceQ.options ?? []).map((o) => [o.value, o.label]));
  const dynamic = sourceAnswer
    .filter((v: string) => v !== 'other' && labelByValue.has(v))
    .map((v: string) => ({ value: v, label: labelByValue.get(v)! }));
  return [...dynamic, ...(q.options ?? [])];
}

/**
 * Group visible questions into sections, preserving SECTIONS order.
 * Returns only sections that have at least one visible question.
 */
export function getQuestionsBySection(
  answers: Record<string, any>,
  sessionFlags: Record<string, boolean> = {}
): Array<{ section: Section; questions: Question[] }> {
  const visible = getVisibleQuestions(answers, sessionFlags);
  return SECTIONS
    .map((section) => ({
      section,
      questions: visible.filter((q) => q.section === section.id),
    }))
    .filter((s) => s.questions.length > 0);
}

/**
 * Computes the widget mode for the SA summary / review step.
 */
export function computeWidgetMode(answers: Record<string, any>): {
  mode: string;
  description: string;
} | null {
  if (answers['wants_booking_widget'] !== 'yes') return null;

  const lq = answers['has_lead_qualification'];
  const platform = answers['qualification_platform'];
  const scheduling = answers['booking_widget_scheduling'];

  if (lq === 'yes' && platform === 'hubspot') {
    return {
      mode: 'Customer Only',
      description: 'Contact capture only — no Zuper job created. Leads flow into HubSpot.',
    };
  }
  if (lq === 'yes') {
    return {
      mode: 'Lead Qualification Widget',
      description: 'Creates a contact and Lead Qualification job in Zuper — enters the 5-min SLA pipeline.',
    };
  }
  if (scheduling === 'slot_and_tech') {
    return {
      mode: 'Full Booking — Slot + Tech',
      description: 'Customer picks a service, date, time, and technician. Inspection job created immediately.',
    };
  }
  if (scheduling === 'slot_only') {
    return {
      mode: 'Full Booking — Slot Only',
      description: 'Customer picks a service and slot. Team assigns the technician.',
    };
  }
  return {
    mode: 'Full Booking — Contact Only',
    description: 'Customer submits details online. Team calls to schedule.',
  };
}
