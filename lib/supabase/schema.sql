-- lib/supabase/schema.sql

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  sa_email TEXT NOT NULL,
  dc_region TEXT NOT NULL DEFAULT 'us-east-1',
  zuper_api_key TEXT NOT NULL,
  unique_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  has_zuper_connect BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  -- Funnel instrumentation
  first_opened_at TIMESTAMPTZ,
  last_seen_step INTEGER,
  -- Stalled-session reminders
  reminder_sent_at TIMESTAMPTZ,
  reminder_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  categories JSONB,
  statuses JSONB,
  checklists JSONB,
  notifications JSONB,
  workflows JSONB,
  workflow_explanations JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  answer JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, question_id)
);

CREATE TABLE change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  request_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  flow_variant TEXT,
  selected_brands TEXT[],
  selected_vendors TEXT[],
  insurance_percentage INTEGER,
  pdf_url TEXT,
  email_sent BOOLEAN DEFAULT false
);

-- Admin OTP codes (email-based login, zuper.co only)
CREATE TABLE admin_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  attempts INTEGER NOT NULL DEFAULT 0,   -- brute-force guard: code burned after 5 wrong guesses
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE change_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_otps DISABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION for existing databases (run this block in the Supabase SQL editor
-- if the tables above already exist):
--
-- ALTER TABLE sessions   ADD COLUMN IF NOT EXISTS first_opened_at TIMESTAMPTZ;
-- ALTER TABLE sessions   ADD COLUMN IF NOT EXISTS last_seen_step INTEGER;
-- ALTER TABLE sessions   ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;
-- ALTER TABLE sessions   ADD COLUMN IF NOT EXISTS reminder_count INTEGER NOT NULL DEFAULT 0;
-- ALTER TABLE admin_otps ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0;
-- ─────────────────────────────────────────────────────────────────────────────
