export type QuestionType =
  | 'single_select'
  | 'multi_select'
  | 'single_line'
  | 'multi_line'
  | 'card_select';

export interface Question {
  id: string;
  text: string;
  subtext?: string;
  type: QuestionType;
  options?: { value: string; label: string; icon?: string }[];
  otherOption?: boolean;
  affectsFlow?: boolean;
  flowKey?: string;
  condition?: {
    questionId: string;
    answer: string | string[];
  };
  required?: boolean;
}

export const QUESTIONS: Question[] = [
  {
    id: 'has_lead_qualification',
    text: 'Do you have a lead qualification process today?',
    subtext: 'This is when someone checks if a new lead is worth pursuing before booking an inspection.',
    type: 'single_select',
    options: [
      { value: 'yes', label: 'Yes, we qualify leads before inspection' },
      { value: 'no', label: 'No, we book inspections directly' },
    ],
    affectsFlow: true,
    flowKey: 'hasLeadQualification',
    required: true,
  },
  {
    id: 'qualification_platform',
    text: 'Where does lead qualification happen?',
    subtext: 'We recommend managing this inside Zuper for a unified workflow.',
    type: 'single_select',
    options: [
      { value: 'hubspot', label: 'In HubSpot (we manage leads there)' },
      { value: 'zuper', label: 'In Zuper (recommended)' },
      { value: 'other', label: 'Somewhere else' },
    ],
    affectsFlow: true,
    flowKey: 'qualificationPlatform',
    condition: { questionId: 'has_lead_qualification', answer: 'yes' },
    required: true,
  },
  {
    id: 'does_insurance',
    text: 'Do you work on insurance jobs?',
    subtext: 'Insurance jobs have a different flow — storm damage, adjuster visits, supplements, etc.',
    type: 'single_select',
    options: [
      { value: 'yes_primary', label: 'Yes, most of our work is insurance' },
      { value: 'yes_some', label: 'Yes, we do some insurance jobs' },
      { value: 'no', label: 'No, retail only' },
    ],
    affectsFlow: true,
    flowKey: 'doesInsurance',
    required: true,
  },
  {
    id: 'insurance_percentage',
    text: 'Roughly what percentage of your jobs are insurance?',
    type: 'single_line',
    subtext: 'A rough estimate is fine. E.g. "60%"',
    condition: { questionId: 'does_insurance', answer: ['yes_primary', 'yes_some'] },
  },
  {
    id: 'uses_zuper_connect',
    text: 'Do you want to use Zuper Connect (a dedicated business phone number)?',
    subtext:
      'Zuper Connect gives you a phone number that lives inside Zuper — calls and texts from customers are tracked against jobs.',
    type: 'single_select',
    options: [
      { value: 'yes', label: 'Yes, sounds useful' },
      { value: 'no', label: "No, we'll use our existing phone setup" },
      { value: 'later', label: 'Maybe later, skip for now' },
    ],
    affectsFlow: true,
    flowKey: 'usesZuperConnect',
    required: true,
  },
  {
    id: 'migrate_number',
    text: 'Do you want to migrate your existing business number to Zuper Connect?',
    type: 'single_select',
    options: [
      { value: 'yes', label: 'Yes, keep the same number' },
      { value: 'no', label: 'No, give us a new number' },
    ],
    condition: { questionId: 'uses_zuper_connect', answer: 'yes' },
  },
  {
    id: 'wants_booking_widget',
    text: 'Do you want a booking widget on your website?',
    subtext:
      "A small form embedded in your website that lets homeowners request a job — it creates a lead in Zuper automatically.",
    type: 'single_select',
    options: [
      { value: 'yes', label: "Yes, that'd be great" },
      { value: 'no', label: 'No, we handle all incoming requests manually' },
    ],
    affectsFlow: true,
    flowKey: 'hasBookingWidget',
    required: true,
  },
  {
    id: 'brands',
    text: 'Which roofing brands do you work with?',
    subtext: "We'll set up a Good / Better / Best proposal structure for each brand you select.",
    type: 'card_select',
    options: [
      { value: 'gaf', label: 'GAF' },
      { value: 'certainteed', label: 'CertainTeed' },
      { value: 'owens_corning', label: 'Owens Corning' },
      { value: 'boral', label: 'Boral' },
      { value: 'iko', label: 'IKO' },
      { value: 'tamko', label: 'TAMKO' },
      { value: 'atlas', label: 'Atlas' },
      { value: 'decra', label: 'Decra' },
      { value: 'malarkey', label: 'Malarkey' },
      { value: 'topshield', label: 'TopShield' },
      { value: 'berger', label: 'Berger' },
      { value: 'carlisle', label: 'Carlisle' },
    ],
    otherOption: true,
    required: true,
  },
  {
    id: 'vendors',
    text: 'Which distributors / vendors do you order from?',
    subtext: 'This helps us set up your supplier catalog correctly.',
    type: 'card_select',
    options: [
      { value: 'srs', label: 'SRS Distribution' },
      { value: 'abc', label: 'ABC Supply' },
      { value: 'qxo', label: 'QXO' },
      { value: 'beacon', label: 'Beacon Roofing Supply' },
      { value: 'gulfeagle', label: 'Gulf Eagle Supply' },
    ],
    otherOption: true,
  },
];

export function getVisibleQuestions(answers: Record<string, any>): Question[] {
  return QUESTIONS.filter((q) => {
    if (!q.condition) return true;
    const answer = answers[q.condition.questionId];
    if (!answer) return false;
    if (Array.isArray(q.condition.answer)) {
      return q.condition.answer.includes(answer);
    }
    return answer === q.condition.answer;
  });
}
