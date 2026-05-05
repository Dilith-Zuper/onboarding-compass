export interface WizardSession {
  id: string;
  org_name: string;
  customer_email: string;
  sa_email: string;
  dc_region: string;
  unique_token: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'live';
  created_at: string;
  updated_at: string;
}

export interface WizardState {
  currentStep: number;
  answers: Record<string, any>;
  changeRequests: Record<string, string>;
  customerName: string;
  completionScore: number;
}

export type WizardStep = 'welcome' | 'questions' | 'flow' | 'snapshot' | 'review';
