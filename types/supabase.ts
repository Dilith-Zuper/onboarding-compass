export interface Session {
  id: string;
  org_name: string;
  customer_email: string;
  sa_email: string;
  dc_region: string;
  zuper_api_key: string;
  unique_token: string;
  has_zuper_connect: boolean;
  status: 'pending' | 'in_progress' | 'submitted' | 'live';
  created_at: string;
  updated_at: string;
}

export interface Snapshot {
  id: string;
  session_id: string;
  fetched_at: string;
  categories: any;
  statuses: any;
  checklists: any;
  notifications: any;
  workflows: any;
  created_at: string;
}

export interface Response {
  id: string;
  session_id: string;
  question_id: string;
  answer: any;
  created_at: string;
}

export interface ChangeRequest {
  id: string;
  session_id: string;
  module: string;
  request_text: string;
  created_at: string;
}

export interface Submission {
  id: string;
  session_id: string;
  submitted_at: string;
  flow_variant: string | null;
  selected_brands: string[] | null;
  selected_vendors: string[] | null;
  pdf_url: string | null;
  email_sent: boolean;
}

