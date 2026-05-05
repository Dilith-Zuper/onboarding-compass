# ZUPER ONBOARDING COMPASS — CLAUDE CODE BUILD SPECIFICATION
> Single source of truth. Read this entire file before writing a single line of code.
> Product name: **Zuper Onboarding Compass**
> Internal codename: `compass`

---

## 0. WHAT YOU ARE BUILDING

A web application that helps roofing companies understand their Zuper account before they touch anything. When a deal closes, a Zuper SA or PM generates a unique customer link. The customer opens it, answers guided questions about how they run their business, and the app:

1. Adapts a live flowchart showing exactly their version of the roofing workflow in Zuper
2. Shows their account's live configuration (categories, statuses, checklists, notifications, workflows) fetched from the Zuper API — with AI-translated plain English explanations
3. Lets them request changes inline (rename statuses, list their brands, pick vendors, etc.)
4. Submits everything — compiles to a Supabase record, emails a PDF summary to the SA and onboarding team

There are two surfaces:
- **Admin Panel** (`/admin`) — internal, SA/PM use, password-protected
- **Customer Wizard** (`/w/[token]`) — public unique URL, customer-facing

---

## 1. TECH STACK

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | API routes keep Zuper API keys server-side |
| Language | TypeScript (strict) | Shared types across admin + customer |
| Styling | Tailwind CSS + CSS variables | Design token consistency |
| DB | Supabase (Postgres + Storage) | Rows for sessions, snapshots, responses, reports |
| Auth (admin) | Single env-var password + JWT cookie | No auth library needed for MVP |
| Flow diagram | React Flow (`@xyflow/react`) | Interactive, animatable, handles dynamic nodes |
| PDF | `@react-pdf/renderer` | Server-side PDF generation |
| Email | Resend + `react-email` | Native Vercel integration, React templates |
| AI | Anthropic Claude API (`claude-sonnet-4-20250514`) | Workflow JSON → plain English explanation |
| Hosting | Vercel | Zero config for Next.js |
| Icons | Lucide React | Consistent icon set |
| Animations | Framer Motion | Step transitions, progress, node reveals |

---

## 2. MONOREPO STRUCTURE

```
compass/
├── CLAUDE.md                          ← this file
├── .env.local                         ← never commit
├── .env.example                       ← commit this
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
│
├── app/                               ← Next.js App Router
│   ├── layout.tsx                     ← root layout (Zuper brand fonts/colors)
│   ├── page.tsx                       ← redirect to /admin
│   │
│   ├── admin/                         ← SA Admin Panel
│   │   ├── layout.tsx                 ← auth check layout
│   │   ├── login/page.tsx             ← password login
│   │   ├── page.tsx                   ← dashboard: list all sessions
│   │   ├── new/page.tsx               ← create new customer session
│   │   └── session/[id]/page.tsx      ← view session, generate go-live report
│   │
│   ├── w/                             ← Customer Wizard
│   │   └── [token]/
│   │       ├── page.tsx               ← wizard shell (loads session, renders steps)
│   │       └── submitted/page.tsx     ← confirmation page after submit
│   │
│   └── api/                           ← All API routes
│       ├── admin/
│       │   ├── auth/route.ts          ← POST: validate password, set cookie
│       │   ├── sessions/route.ts      ← GET: list sessions, POST: create session
│       │   └── go-live/[id]/route.ts  ← POST: generate go-live report
│       ├── customer/
│       │   ├── [token]/route.ts       ← GET: fetch session+snapshot for customer
│       │   └── [token]/submit/route.ts ← POST: save responses + requests, trigger email+PDF
│       └── zuper/
│           ├── [token]/snapshot/route.ts     ← GET: fetch+cache Zuper config
│           ├── [token]/workflows/route.ts    ← GET: list workflows from Zuper
│           └── [token]/workflow/[uid]/route.ts ← GET: single workflow + AI explanation
│
├── components/
│   ├── admin/
│   │   ├── SessionForm.tsx            ← Create session form
│   │   ├── SessionTable.tsx           ← List sessions
│   │   └── GoLiveButton.tsx
│   ├── wizard/
│   │   ├── WizardShell.tsx            ← Progress bar, step navigation, gamification
│   │   ├── WizardStep.tsx             ← Individual step wrapper with animation
│   │   ├── steps/
│   │   │   ├── WelcomeStep.tsx        ← Step 0: Welcome + company name input
│   │   │   ├── QuestionsStep.tsx      ← Step 1: Discovery questions (dynamic)
│   │   │   ├── FlowStep.tsx           ← Step 2: Live flowchart reveal
│   │   │   ├── SnapshotStep.tsx       ← Step 3: Account config (tabbed modules)
│   │   │   └── ReviewStep.tsx         ← Step 4: Review all requests + submit
│   │   ├── flowchart/
│   │   │   ├── CompassFlow.tsx        ← React Flow wrapper
│   │   │   ├── FlowNodes.tsx          ← Custom node components (job types, integrations)
│   │   │   └── flowVariants.ts        ← FLOW LOGIC: question answers → node set
│   │   ├── modules/
│   │   │   ├── ModuleCard.tsx         ← Reusable: shows module data + change request field
│   │   │   ├── StatusesModule.tsx
│   │   │   ├── CategoriesModule.tsx
│   │   │   ├── ChecklistsModule.tsx
│   │   │   ├── NotificationsModule.tsx
│   │   │   ├── WorkflowsModule.tsx    ← Shows AI-explained workflows
│   │   │   └── CPQModule.tsx          ← Static: shows G/B/B per selected brand
│   │   └── gamification/
│   │       ├── ProgressBar.tsx
│   │       ├── MilestoneToast.tsx
│   │       └── CompletionScore.tsx
│   └── shared/
│       ├── ZuperLogo.tsx
│       ├── Badge.tsx                  ← "Renameable" / "SA-Managed" / "Fixed" badges
│       └── LoadingSpinner.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  ← browser client
│   │   ├── server.ts                  ← server client (API routes)
│   │   └── schema.sql                 ← FULL schema — run this to init DB
│   ├── zuper/
│   │   ├── api.ts                     ← All Zuper API calls (server-side only)
│   │   └── transformer.ts             ← Raw API response → typed app models
│   ├── ai/
│   │   ├── explainWorkflow.ts         ← Claude API call: workflow JSON → plain English
│   │   └── prompts.ts                 ← All AI prompts (single source of truth)
│   ├── pdf/
│   │   ├── OnboardingReport.tsx       ← react-pdf: customer snapshot + requests
│   │   └── GoLiveReport.tsx           ← react-pdf: go-live diff report
│   ├── email/
│   │   ├── OnboardingEmail.tsx        ← react-email: sent on customer submit
│   │   └── GoLiveEmail.tsx            ← react-email: sent on go-live
│   ├── flow/
│   │   └── variants.ts                ← Flow variant decision tree (imported by FlowNodes)
│   ├── questions.ts                   ← MASTER QUESTION REGISTRY (all questions defined here)
│   ├── configMatrix.ts                ← Per-module: what's renameable / SA-managed / fixed
│   └── utils.ts
│
└── types/
    ├── supabase.ts                    ← Generated or hand-written DB types
    ├── zuper.ts                       ← Zuper API response types
    └── wizard.ts                      ← Wizard state types
```

---

## 3. ENVIRONMENT VARIABLES

```bash
# .env.example

# Admin
ADMIN_PASSWORD=changeme                        # Single password for admin panel
ADMIN_JWT_SECRET=generate-a-random-32-char-string

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=                     # Server-side only, never expose to browser

# Anthropic
ANTHROPIC_API_KEY=                             # Server-side only

# Resend
RESEND_API_KEY=                                # Server-side only
RESEND_FROM_EMAIL=onboarding@zuper.co          # Must be a verified sender domain

# App
NEXT_PUBLIC_APP_URL=https://compass.zuper.co   # Used for generating customer links
```

---

## 4. SUPABASE SCHEMA

Run this SQL exactly in your Supabase project's SQL editor to initialize the database.

```sql
-- lib/supabase/schema.sql

-- Sessions: one per customer, created by SA
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  sa_email TEXT NOT NULL,
  dc_region TEXT NOT NULL DEFAULT 'us-east-1',     -- e.g. 'us-east-1', 'eu-west-1'
  zuper_api_key TEXT NOT NULL,                      -- store encrypted in prod; plaintext for MVP
  unique_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending',           -- pending | in_progress | submitted | live
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Snapshots: Zuper config fetched at session creation time
CREATE TABLE snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  categories JSONB,
  statuses JSONB,
  checklists JSONB,
  notifications JSONB,
  workflows JSONB,                                  -- list of workflows (without full JSON)
  workflow_explanations JSONB,                      -- AI-explained per workflow_uid
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Responses: customer's answers to the discovery questionnaire
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,                        -- matches questions.ts registry key
  answer JSONB NOT NULL,                            -- flexible: string | string[] | boolean
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, question_id)
);

-- Change requests: one row per module per session
CREATE TABLE change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  module TEXT NOT NULL,                             -- statuses | categories | checklists | notifications | cpq | general
  request_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Submissions: final submit record
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  flow_variant TEXT,                                -- computed from answers
  selected_brands TEXT[],
  selected_vendors TEXT[],
  insurance_percentage INTEGER,
  pdf_url TEXT,                                     -- Supabase Storage URL
  email_sent BOOLEAN DEFAULT false
);

-- Go-live reports
CREATE TABLE golive_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  generated_at TIMESTAMPTZ DEFAULT now(),
  generated_by TEXT,                                -- SA email
  snapshot_at_golive JSONB,                         -- full config at go-live time
  diff_summary JSONB,                               -- what changed vs original snapshot
  pdf_url TEXT,
  report_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex')
);

-- RLS: disable for MVP (enable and add policies before production)
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE change_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE golive_reports DISABLE ROW LEVEL SECURITY;
```

---

## 5. ZUPER API REFERENCE

### Authentication
All requests use:
```
x-api-key: {customer_api_key}
```

### Base URL pattern
```
https://{dc_region}.zuperpro.com/api/
```
Example: `https://us-east-1.zuperpro.com/api/`

The `dc_region` is stored on the session and entered by the SA when creating the session. Common values: `us-east-1`, `eu-west-1`, `ap-south-1`.

### Confirmed endpoints (verified against real API responses)

| Data | Method | Full URL | Notes |
|---|---|---|---|
| Job categories + statuses | GET | `https://{dc_region}.zuperpro.com/api/jobs/category?populate_statuses=true` | Returns categories with nested `job_statuses[]` array — single call gets both |
| Notifications | GET | `https://{dc_region}.zuperpro.com/api/customer_notification?count=100&page=1` | Returns `customer_notification_uid`, linked category + status |
| Checklist (per category+status) | GET | `https://{dc_region}.zuperpro.com/api/settings/checklist?category_uid={uid}&job_status_uid={uid}` | Must loop: for each category, fetch checklist once (use the first status uid of that category) |
| Workflows (list) | GET | `https://{dc_region}-workflow.zuperpro.com/api/workflows?sort=DESC&sort_by=created_at&limit=50&page=1` | Different subdomain |
| Single workflow (for AI) | GET | `https://{dc_region}-workflow.zuperpro.com/api/workflows/{workflow_uid}` | Full node JSON for AI explanation |

**IMPORTANT**: The workflow API uses a different subdomain pattern: `{dc_region}-workflow.zuperpro.com` not `{dc_region}.zuperpro.com`.

### Checklist fetch strategy
The checklist endpoint requires both `category_uid` AND `job_status_uid`. Do NOT try to fetch all checklists in one call.

```typescript
// For each category returned from /jobs/category:
//   take the first status_uid from category.job_statuses[0].status_uid
//   fetch: /settings/checklist?category_uid={cat_uid}&job_status_uid={status_uid}
// Fire all in parallel with Promise.allSettled
// Group results by category name in the snapshot
```

This means if there are 6 categories, you make 6 checklist calls in parallel — totally fine.

### Fetching the snapshot (server-side, in `/api/zuper/[token]/snapshot/route.ts`)
1. Look up session by token → get `zuper_api_key`, `dc_region`
2. Fire categories + notifications calls in parallel (Promise.allSettled)
3. From categories response, extract all category UIDs → fire checklist calls in parallel
4. Transform all responses using `lib/zuper/transformer.ts`
5. Store in `snapshots` table
6. For workflows: fetch list first, then fetch first 10 individually for AI explanation **async** (do not block snapshot storage on this)
7. Return snapshot to client immediately; workflow AI explanations will populate when ready

---

## 6. ZUPER DATA TRANSFORMER

Field names below are verified against real API responses. Do not guess — use exactly these field keys.

```typescript
// lib/zuper/transformer.ts

// ── Types ──────────────────────────────────────────────────────────────────

export interface ZuperCategory {
  uid: string;            // category_uid
  name: string;           // category_name
  color: string;          // category_color
  statuses: ZuperStatus[];// nested job_statuses[] from ?populate_statuses=true
  businessUnits: string[];// business_unit[].bu_name
}

export interface ZuperStatus {
  uid: string;            // status_uid
  name: string;           // status_name
  type: string;           // status_type: NEW | STARTED | COMPLETED | CANCELLED | OTHER | ON_MY_WAY
  color: string;          // status_color
  requireSignature: boolean;
  trackTime: boolean;
  enabledForField: boolean | null;
  enabledForManager: boolean | null;
}

export interface ZuperChecklistItem {
  uid: string;            // checklist_uid
  label: string;          // field_name
  type: string;           // field_type: RADIO | SINGLE_ITEM | TEXT | PHOTO | SIGNATURE | etc.
  description: string;    // field_description
  options: string[];      // field_options[]
  isRequired: boolean;    // is_required
  displayOrder: number;   // display_order
}

export interface ZuperChecklist {
  categoryUid: string;
  categoryName: string;
  items: ZuperChecklistItem[];
}

export interface ZuperNotification {
  uid: string;            // customer_notification_uid
  name: string;           // notification_name
  type: string;           // notification_type: EMAIL | SMS
  categoryName: string;   // job_category.category_name
  statusName: string;     // job_status.status_name
  statusType: string;     // job_status.status_type
  emailSubject: string;   // email_subject
  isActive: boolean;      // is_active
}

export interface ZuperWorkflowSummary {
  uid: string;            // workflow_uid
  name: string;           // workflow_name
  description: string;    // workflow_description
  trigger: string;        // meta_data.initial_nodes[0].data.action_name
  isActive: boolean;      // is_active
  nodeCount: number;      // meta_data.total_nodes
  plainEnglish?: {        // AI-generated, populated async
    headline: string;
    description: string;
    saves: string[];
  };
}

export interface ZuperSnapshot {
  categories: ZuperCategory[];
  checklists: ZuperChecklist[];   // one entry per category
  notifications: ZuperNotification[];
  workflows: ZuperWorkflowSummary[];
}

// ── Transformers ───────────────────────────────────────────────────────────

/**
 * Transform GET /jobs/category?populate_statuses=true
 * Returns categories with nested statuses — one API call covers both.
 */
export function transformCategories(raw: any): ZuperCategory[] {
  const data: any[] = raw?.data || [];
  return data
    .filter((c) => !c.is_deleted)
    .map((c) => ({
      uid: c.category_uid,
      name: c.category_name,
      color: c.category_color || '#cccccc',
      businessUnits: (c.business_unit || []).map((bu: any) => bu.bu_name),
      statuses: (c.job_statuses || []).map((s: any): ZuperStatus => ({
        uid: s.status_uid,
        name: s.status_name?.trim(),
        type: s.status_type || 'OTHER',
        color: s.status_color || '#cccccc',
        requireSignature: s.require_customer_signature ?? false,
        trackTime: s.track_time_in_status ?? false,
        enabledForField: s.enabled_for_field_executive ?? null,
        enabledForManager: s.enabled_for_manager ?? null,
      })),
    }));
}

/**
 * Transform GET /settings/checklist?category_uid=...&job_status_uid=...
 * Call once per category. Pass the categoryUid + categoryName so results can be grouped.
 */
export function transformChecklist(
  raw: any,
  categoryUid: string,
  categoryName: string
): ZuperChecklist {
  const items: any[] = raw?.data || [];
  return {
    categoryUid,
    categoryName,
    items: items
      .filter((i) => !i.is_deleted)
      .sort((a, b) => a.display_order - b.display_order)
      .map((i): ZuperChecklistItem => ({
        uid: i.checklist_uid,
        label: i.field_name,
        type: i.field_type,             // RADIO | SINGLE_ITEM | TEXT | PHOTO | SIGNATURE | NUMBER | DATE
        description: i.field_description || '',
        options: i.field_options || [],
        isRequired: i.is_required ?? false,
        displayOrder: i.display_order,
      })),
  };
}

/**
 * Transform GET /customer_notification?count=100&page=1
 */
export function transformNotifications(raw: any): ZuperNotification[] {
  const data: any[] = raw?.data || [];
  return data
    .filter((n) => !n.is_deleted)
    .map((n): ZuperNotification => ({
      uid: n.customer_notification_uid,
      name: n.notification_name,
      type: n.notification_type,        // EMAIL | SMS
      categoryName: n.job_category?.category_name || 'General',
      statusName: n.job_status?.status_name || '',
      statusType: n.job_status?.status_type || '',
      emailSubject: n.email_subject || '',
      isActive: n.is_active ?? true,
    }));
}

/**
 * Transform GET /workflows?... (list endpoint)
 */
export function transformWorkflows(raw: any): ZuperWorkflowSummary[] {
  const data: any[] = raw?.data || [];
  return data
    .filter((w) => !w.is_deleted)
    .map((w): ZuperWorkflowSummary => ({
      uid: w.workflow_uid,
      name: w.workflow_name,
      description: w.workflow_description || '',
      trigger: w.meta_data?.initial_nodes?.[0]?.data?.action_name || 'Unknown trigger',
      isActive: w.is_active ?? true,
      nodeCount: w.meta_data?.total_nodes || 0,
      plainEnglish: undefined,
    }));
}

// ── Human-readable field type labels (for display in ChecklistsModule) ────

export const FIELD_TYPE_LABELS: Record<string, string> = {
  RADIO: 'Yes / No choice',
  SINGLE_ITEM: 'Dropdown selection',
  TEXT: 'Text input',
  PHOTO: 'Photo capture',
  SIGNATURE: 'Customer signature',
  NUMBER: 'Number input',
  DATE: 'Date picker',
  CHECKBOX: 'Checkbox',
  MULTI_SELECT: 'Multiple choice',
};

// ── Status type labels (for display in StatusesModule) ────────────────────

export const STATUS_TYPE_LABELS: Record<string, string> = {
  NEW: 'Starting status',
  STARTED: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  OTHER: 'Custom step',
  ON_MY_WAY: 'On the way',
};
```

---

## 7. ZUPER API CLIENT

```typescript
// lib/zuper/api.ts
// ALL Zuper API calls live here. Server-side only — never import this in client components.

import {
  transformCategories,
  transformChecklist,
  transformNotifications,
  transformWorkflows,
  ZuperSnapshot,
  ZuperCategory,
} from './transformer';

export async function fetchZuperSnapshot(
  apiKey: string,
  dcRegion: string
): Promise<ZuperSnapshot> {
  const base = `https://${dcRegion}.zuperpro.com/api`;
  const wfBase = `https://${dcRegion}-workflow.zuperpro.com/api`;
  const headers = { 'x-api-key': apiKey };

  // ── Step 1: fetch categories+statuses and notifications in parallel ──────
  const [categoriesRes, notificationsRes, workflowsRes] = await Promise.allSettled([
    fetch(`${base}/jobs/category?populate_statuses=true`, { headers }).then((r) => r.json()),
    fetch(`${base}/customer_notification?count=100&page=1`, { headers }).then((r) => r.json()),
    fetch(`${wfBase}/workflows?sort=DESC&sort_by=created_at&limit=50&page=1`, { headers }).then((r) => r.json()),
  ]);

  const rawCategories = categoriesRes.status === 'fulfilled' ? categoriesRes.value : { data: [] };
  const rawNotifications = notificationsRes.status === 'fulfilled' ? notificationsRes.value : { data: [] };
  const rawWorkflows = workflowsRes.status === 'fulfilled' ? workflowsRes.value : { data: [] };

  const categories = transformCategories(rawCategories);
  const notifications = transformNotifications(rawNotifications);
  const workflows = transformWorkflows(rawWorkflows);

  // ── Step 2: fetch checklists — one per category, all in parallel ─────────
  // Use the first status uid from each category as the required param.
  // If a category has no statuses, skip it.
  const checklistPromises = categories
    .filter((cat) => cat.statuses.length > 0)
    .map((cat) =>
      fetch(
        `${base}/settings/checklist?category_uid=${cat.uid}&job_status_uid=${cat.statuses[0].uid}`,
        { headers }
      )
        .then((r) => r.json())
        .then((raw) => transformChecklist(raw, cat.uid, cat.name))
        .catch(() => ({ categoryUid: cat.uid, categoryName: cat.name, items: [] }))
    );

  const checklists = await Promise.all(checklistPromises);

  return { categories, checklists, notifications, workflows };
}

/**
 * Fetch a single workflow's full JSON for AI explanation.
 * Called async after snapshot is stored — does NOT block snapshot delivery.
 */
export async function fetchWorkflowDetail(
  apiKey: string,
  dcRegion: string,
  workflowUid: string
): Promise<object> {
  const url = `https://${dcRegion}-workflow.zuperpro.com/api/workflows/${workflowUid}`;
  const res = await fetch(url, { headers: { 'x-api-key': apiKey } });
  const json = await res.json();
  return json?.data || json;
}
```

## 8. AI WORKFLOW EXPLANATION (was §7)

```typescript
// lib/ai/prompts.ts

export const WORKFLOW_EXPLANATION_PROMPT = `
You are explaining a Zuper field service automation to a roofing business owner.
They are NOT technical. They know roofing — not software.

Here is a Zuper workflow configuration in JSON format:
{WORKFLOW_JSON}

Your job:
1. Write a SHORT headline (max 10 words) describing what this automation does in plain English.
   Example: "Reschedules follow-up calls when a lead doesn't pick up"
2. Write 2-3 sentences explaining: WHEN does this run, WHAT does it do, and WHY it helps their business.
   Use roofing business language. No technical terms. No JSON. No mention of APIs, nodes, or code.
3. List up to 3 bullet points of what this automation saves them from doing manually.

Format your response as JSON only:
{
  "headline": "...",
  "description": "...",
  "saves": ["...", "...", "..."]
}
`;
```

```typescript
// lib/ai/explainWorkflow.ts
import Anthropic from '@anthropic-ai/sdk';
import { WORKFLOW_EXPLANATION_PROMPT } from './prompts';

const client = new Anthropic();

export async function explainWorkflow(workflowJson: object): Promise<{
  headline: string;
  description: string;
  saves: string[];
}> {
  const prompt = WORKFLOW_EXPLANATION_PROMPT.replace(
    '{WORKFLOW_JSON}',
    JSON.stringify(workflowJson, null, 2)
  );

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  const clean = text.replace(/```json|```/g, '').trim();
  
  try {
    return JSON.parse(clean);
  } catch {
    return {
      headline: workflowJson['workflow_name'] || 'Automation',
      description: 'This automation helps manage your workflow automatically.',
      saves: [],
    };
  }
}
```

---

## 9. MASTER QUESTION REGISTRY

This is the single source of truth for all discovery questions. Add new questions here — the wizard renders them dynamically.

```typescript
// lib/questions.ts

export type QuestionType = 
  | 'single_select'    // radio buttons
  | 'multi_select'     // checkboxes
  | 'single_line'      // text input
  | 'multi_line'       // textarea
  | 'card_select';     // visual card grid (used for brands/vendors)

export interface Question {
  id: string;
  text: string;
  subtext?: string;
  type: QuestionType;
  options?: { value: string; label: string; icon?: string }[];
  otherOption?: boolean;      // adds a free-text "Other" option
  affectsFlow?: boolean;      // if true, answer changes the flowchart
  flowKey?: string;           // key used in flowVariants.ts
  condition?: {               // only show this question if...
    questionId: string;
    answer: string | string[];
  };
  required?: boolean;
}

export const QUESTIONS: Question[] = [
  // ─── FLOW-AFFECTING QUESTIONS ────────────────────────────────────────────

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
    subtext: 'Zuper Connect gives you a phone number that lives inside Zuper — calls and texts from customers are tracked against jobs.',
    type: 'single_select',
    options: [
      { value: 'yes', label: 'Yes, sounds useful' },
      { value: 'no', label: 'No, we\'ll use our existing phone setup' },
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
    subtext: 'A small form embedded in your website that lets homeowners request a job — it creates a lead in Zuper automatically.',
    type: 'single_select',
    options: [
      { value: 'yes', label: 'Yes, that\'d be great' },
      { value: 'no', label: 'No, we handle all incoming requests manually' },
    ],
    affectsFlow: true,
    flowKey: 'hasBookingWidget',
    required: true,
  },

  // ─── DATA COLLECTION QUESTIONS ────────────────────────────────────────────

  {
    id: 'brands',
    text: 'Which roofing brands do you work with?',
    subtext: 'We\'ll set up a Good / Better / Best proposal structure for each brand you select.',
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

  // ─── FUTURE QUESTIONS PLACEHOLDER ────────────────────────────────────────
  // Add more questions here. They will automatically appear in the wizard
  // as long as they follow the Question interface above.
  // The wizard supports up to 50+ questions through a paging mechanism
  // (10 questions per page within the QuestionsStep).
];

// Helper: get questions that should show given current answers
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
```

---

## 10. FLOW VARIANT DECISION TREE

```typescript
// lib/flow/variants.ts
// This is the brain of the flowchart. Based on question answers, it returns
// a set of nodes and edges for React Flow to render.

export interface FlowNode {
  id: string;
  label: string;
  type: 'start' | 'job' | 'external' | 'action' | 'integration' | 'end';
  description: string;    // tooltip / hover description
  isOptional?: boolean;
  isExternal?: boolean;   // not in Zuper (e.g. HubSpot)
  color?: string;
}

export interface FlowVariantConfig {
  nodes: FlowNode[];
  edges: { from: string; to: string; label?: string }[];
  skippedNodes?: string[];   // shown greyed out with explanation
}

// All possible flow nodes
export const ALL_FLOW_NODES: Record<string, FlowNode> = {
  website_lead: {
    id: 'website_lead',
    label: 'Website Booking',
    type: 'integration',
    description: 'Homeowner fills out your booking widget. Lead created in Zuper automatically.',
  },
  lead_in: {
    id: 'lead_in',
    label: 'New Lead',
    type: 'start',
    description: 'A potential customer enters your pipeline.',
  },
  hubspot_lead: {
    id: 'hubspot_lead',
    label: 'HubSpot CRM',
    type: 'external',
    isExternal: true,
    description: 'Lead is managed in HubSpot. When qualified, it syncs to Zuper.',
  },
  lead_qualification: {
    id: 'lead_qualification',
    label: 'Lead Qualification Job',
    type: 'job',
    description: 'A Zuper job assigned to your sales rep. They call the lead, confirm interest, and mark it qualified.',
  },
  inspection: {
    id: 'inspection',
    label: 'Inspection Job',
    type: 'job',
    description: 'Field tech visits the property, measures the roof, photos everything via CompanyCam or Hover.',
  },
  insurance_claim: {
    id: 'insurance_claim',
    label: 'Insurance Claim',
    type: 'action',
    description: 'Adjuster visit scheduled. Supplement process tracked. Approval logged before production.',
    isOptional: true,
  },
  cpq: {
    id: 'cpq',
    label: 'CPQ / Estimating',
    type: 'action',
    description: 'Measurements from inspection feed into Zuper\'s CPQ. Good / Better / Best proposals built per brand.',
  },
  proposal: {
    id: 'proposal',
    label: 'Proposal Sent',
    type: 'action',
    description: 'Customer receives their proposal. They can approve it digitally.',
  },
  production: {
    id: 'production',
    label: 'Production Jobs',
    type: 'job',
    description: 'Once approved, production jobs are created — tear off, install, cleanup — each with their own checklist.',
  },
  zuper_connect: {
    id: 'zuper_connect',
    label: 'Zuper Connect',
    type: 'integration',
    description: 'Inbound calls and texts from customers are logged here and linked to jobs.',
    isOptional: true,
  },
  complete: {
    id: 'complete',
    label: 'Job Complete ✓',
    type: 'end',
    description: 'Invoice sent. Payment collected. Review requested.',
  },
};

export function computeFlowVariant(answers: Record<string, any>): FlowVariantConfig {
  const nodes: FlowNode[] = [];
  const edges: { from: string; to: string; label?: string }[] = [];

  const hasQualification = answers['has_lead_qualification'] === 'yes';
  const qualPlatform = answers['qualification_platform'];
  const doesInsurance = answers['does_insurance'] !== 'no';
  const usesConnect = answers['uses_zuper_connect'] === 'yes';
  const hasWidget = answers['wants_booking_widget'] === 'yes';

  // ── Entry point ──
  if (hasWidget) {
    nodes.push(ALL_FLOW_NODES.website_lead);
    nodes.push(ALL_FLOW_NODES.lead_in);
    edges.push({ from: 'website_lead', to: 'lead_in' });
  } else {
    nodes.push(ALL_FLOW_NODES.lead_in);
  }

  // ── Qualification ──
  if (hasQualification && qualPlatform === 'hubspot') {
    nodes.push(ALL_FLOW_NODES.hubspot_lead);
    edges.push({ from: 'lead_in', to: 'hubspot_lead' });
    nodes.push(ALL_FLOW_NODES.inspection);
    edges.push({ from: 'hubspot_lead', to: 'inspection', label: 'Qualified in HubSpot' });
  } else if (hasQualification) {
    nodes.push(ALL_FLOW_NODES.lead_qualification);
    edges.push({ from: 'lead_in', to: 'lead_qualification' });
    nodes.push(ALL_FLOW_NODES.inspection);
    edges.push({ from: 'lead_qualification', to: 'inspection', label: 'Qualified' });
  } else {
    nodes.push(ALL_FLOW_NODES.inspection);
    edges.push({ from: 'lead_in', to: 'inspection' });
  }

  // ── Insurance branch ──
  if (doesInsurance) {
    nodes.push(ALL_FLOW_NODES.insurance_claim);
    edges.push({ from: 'inspection', to: 'insurance_claim', label: 'Insurance job' });
    nodes.push(ALL_FLOW_NODES.cpq);
    edges.push({ from: 'insurance_claim', to: 'cpq', label: 'Approved' });
    edges.push({ from: 'inspection', to: 'cpq', label: 'Retail job' });
  } else {
    nodes.push(ALL_FLOW_NODES.cpq);
    edges.push({ from: 'inspection', to: 'cpq' });
  }

  // ── Proposal ──
  nodes.push(ALL_FLOW_NODES.proposal);
  edges.push({ from: 'cpq', to: 'proposal' });

  // ── Production ──
  nodes.push(ALL_FLOW_NODES.production);
  edges.push({ from: 'proposal', to: 'production', label: 'Customer approved' });

  // ── Complete ──
  nodes.push(ALL_FLOW_NODES.complete);
  edges.push({ from: 'production', to: 'complete' });

  // ── Zuper Connect (sidebar) ──
  if (usesConnect) {
    nodes.push(ALL_FLOW_NODES.zuper_connect);
    // Connect appears as a parallel integration node, not in the main flow
    edges.push({ from: 'lead_in', to: 'zuper_connect', label: 'Calls & texts' });
  }

  return { nodes, edges };
}
```

---

## 11. CONFIGURATION MATRIX

```typescript
// lib/configMatrix.ts
// Per module: what can the customer rename/change vs what's SA-managed vs fixed.

export type ConfigLevel = 'renameable' | 'sa_managed' | 'fixed';

export interface ModuleConfig {
  module: string;
  label: string;
  emoji: string;
  configLevel: ConfigLevel;
  configNote: string;
  changeRequestPrompt: string;
  changeRequestPlaceholder: string;
}

export const CONFIG_MATRIX: ModuleConfig[] = [
  {
    module: 'categories',
    label: 'Job Categories',
    emoji: '📂',
    configLevel: 'renameable',
    configNote: 'You can rename these to match how your team talks about job types.',
    changeRequestPrompt: 'Want to rename any categories or add new ones?',
    changeRequestPlaceholder: 'E.g. "Rename Lead Qualification to Canvassing" or "Add a category for Commercial jobs"',
  },
  {
    module: 'statuses',
    label: 'Job Statuses',
    emoji: '🚦',
    configLevel: 'renameable',
    configNote: 'Status names can be personalised. The flow between them is configured by your SA.',
    changeRequestPrompt: 'Want to rename any statuses to match your team\'s language?',
    changeRequestPlaceholder: 'E.g. "Rename In Progress to Crew on Site" or "Rename Complete to Invoiced"',
  },
  {
    module: 'checklists',
    label: 'Checklists',
    emoji: '✅',
    configLevel: 'renameable',
    configNote: 'Checklist names and items can be updated to match your inspection and production process.',
    changeRequestPrompt: 'Want to update any checklist names or items?',
    changeRequestPlaceholder: 'E.g. "Add a photo requirement to every checklist item" or "Rename the inspection checklist to Site Assessment"',
  },
  {
    module: 'notifications',
    label: 'Notifications',
    emoji: '🔔',
    configLevel: 'sa_managed',
    configNote: 'Notification triggers are configured by your SA. You can request changes to message content or who gets notified.',
    changeRequestPrompt: 'Any changes to who gets notified and when?',
    changeRequestPlaceholder: 'E.g. "Notify the homeowner by SMS when the crew is on the way" or "CC our office manager on all job completion emails"',
  },
  {
    module: 'workflows',
    label: 'Automations',
    emoji: '⚡',
    configLevel: 'sa_managed',
    configNote: 'Automations are set up by your SA and run in the background. You can request adjustments.',
    changeRequestPrompt: 'Any automations you\'d like adjusted or added?',
    changeRequestPlaceholder: 'E.g. "Automatically assign new leads to our sales rep John" or "Send a reminder SMS if a job hasn\'t been scheduled within 48 hours"',
  },
  {
    module: 'cpq',
    label: 'Proposals (CPQ)',
    emoji: '💰',
    configLevel: 'sa_managed',
    configNote: 'Your Good / Better / Best proposal structure will be built per brand you selected. Your SA handles this setup.',
    changeRequestPrompt: 'Anything specific about how you want your proposals structured?',
    changeRequestPlaceholder: 'E.g. "Our Good tier should always include 10-year labor warranty" or "We always upsell ice & water shield in the Better tier"',
  },
];
```

---

## 12. CPQ MODULE (STATIC — NO API FETCH NEEDED)

The CPQ module does not fetch from API. It renders based on the brands the customer selected in the questionnaire.

```typescript
// components/wizard/modules/CPQModule.tsx

const BRAND_GBB_DESCRIPTIONS: Record<string, {
  good: string;
  better: string;
  best: string;
}> = {
  gaf: {
    good: 'GAF Timberline HDZ — lifetime shingles, leak barrier, starter strips',
    better: 'GAF Timberline HDZ + Cobra ventilation + enhanced underlayment',
    best: 'GAF Timberline UHDZ with full System Plus warranty — premium liner, ridge cap, all accessories',
  },
  certainteed: {
    good: 'CertainTeed Landmark — lifetime warranty, StainFighter algae resistance',
    better: 'CertainTeed Landmark Pro + WinterGuard + RoofRunner',
    best: 'CertainTeed Landmark Premium with SureStart PLUS warranty',
  },
  owens_corning: {
    good: 'OC Duration — SureNail Technology, Wind Resistance warranty',
    better: 'OC Duration + WeatherLock + ProArmor underlayment',
    best: 'OC Duration Flex with Preferred Contractor warranty + full system',
  },
  // Add all brands similarly...
};

// The component shows cards for each selected brand,
// each with Good / Better / Best tiers.
// Includes: "Your SA will build these proposals in Zuper CPQ before go-live"
```

---

## 13. GAMIFICATION SPEC

The wizard feels like a game, not a form. Rules:

### Progress Bar
- Sticky at top, full width
- Shows: current step name, steps as dots (completed = filled, current = pulsing, upcoming = empty)
- Animated fill on step advance
- Shows percentage: "62% complete"

### Completion Score
- Each answer fills a "readiness meter"
- Flow questions answered: +15 pts each
- Brands selected: +10 pts
- Vendors selected: +5 pts  
- Change requests submitted: +5 pts each (up to 25)
- Max score: 100
- Show at the end: "Your account is 87% ready to go live 🚀"

### Milestone Toasts (Framer Motion, bottom-right, 3s auto-dismiss)
- After Q1: "Great start! Your flow is taking shape 🏗️"
- After flow revealed: "Your Zuper flow is mapped! Here's what your team will see 👇"
- After brands selected: "Perfect. We'll build your proposals for each brand ✓"
- After all questions: "Discovery complete! Let's look at your account 🔍"
- After snapshot viewed: "Almost there! Review your requests and submit 📋"
- On submit: "You're all set! Your SA will be in touch shortly 🎉"

### Micro-interactions
- Card select: selected cards pulse once on click, show a checkmark
- Each module card in snapshot: expands with a smooth animation on click
- Flowchart nodes: fade in one-by-one (staggered 150ms) when flow is revealed
- Progress bar: smooth CSS transition (not jump)
- Step transitions: horizontal slide (Framer Motion `AnimatePresence`)

---

## 14. WIZARD STEP SEQUENCE

```
Step 0: Welcome
  - Company name is pre-filled from session (org_name)
  - Customer's name input (first name only, used to personalise toasts)
  - "Here's what we'll do in the next 10 minutes" — 4 bullet icons
  - CTA: "Let's Go →"

Step 1: Discovery Questions
  - Renders questions from lib/questions.ts
  - Shows conditional questions dynamically
  - Groups into pages of MAX 6 questions per page
  - Each page has its own "Continue →" button
  - Progress bar shows position within step 1

Step 2: Your Flow
  - Full-width React Flow diagram
  - "Based on what you told us, here's how your jobs will flow in Zuper"
  - Nodes animate in staggered
  - Each node is clickable → tooltip with description
  - External nodes (HubSpot) shown with a dashed border
  - Optional nodes shown with dotted border + "Optional" badge
  - CTA: "Looks good, show me the account →"

Step 3: Account Snapshot
  - Tabs or accordion for each module (Categories, Statuses, Checklists, Notifications, Automations, CPQ)
  - Each module shows live data from the Zuper API
  - Each item tagged with Badge: Renameable / SA-Managed / Fixed
  - Each module has a change request text area at the bottom
  - Auto-saves on blur (no submit button per module)
  - CPQ module is static — shows G/B/B cards per selected brand

Step 4: Review & Submit
  - Summary of answers
  - Summary of all change requests (editable)
  - Terms: "By submitting, you confirm these are your requirements. 
    Your SA will review and configure accordingly."
  - Big submit button
  - On submit: loading state, then redirect to /w/[token]/submitted

Submitted page:
  - Confetti animation (canvas-confetti)
  - Completion score displayed
  - "What happens next" — 3 steps with icons
  - "Questions? Email onboarding@zuper.co"
```

---

## 15. EMAIL SPEC (Resend + react-email)

**Why Resend:** Vercel-native, generous free tier (3,000 emails/month), react-email components, reliable deliverability. No SMTP config. Setup: create account at resend.com, add your domain, get API key.

### Email 1: Customer submission notification
- **To:** SA email + `onboarding@zuper.co`
- **Subject:** `[Compass] {org_name} has completed their onboarding questionnaire`
- **Content:**
  - Header: Zuper logo + "Onboarding Compass"
  - Section: Customer answers summary
  - Section: Change requests by module (highlighted in amber)
  - Section: Flow variant computed
  - Section: Selected brands + vendors
  - Attachment: PDF of full snapshot + requests
  - Footer: Link to admin panel session

### Email 2: Customer confirmation
- **To:** customer email
- **Subject:** `Your Zuper setup is being prepared, {customer_name}!`
- **Content:**
  - Friendly confirmation
  - Summary of what they requested
  - "What happens next" timeline
  - Contact: their SA email

### Go-live email
- **To:** `support@zuper.co` + SA email
- **Subject:** `[Go-Live] {org_name} — Account Configuration Report`
- **Content:**
  - Full account snapshot at go-live
  - Diff from original snapshot (what changed)
  - Attachment: PDF go-live report

---

## 16. PDF SPEC (@react-pdf/renderer)

### Onboarding Report PDF
Structure:
1. Cover page: Zuper logo, org name, date, "Onboarding Configuration Report"
2. Discovery Answers section
3. Flow variant diagram (render as image — screenshot the React Flow component to PNG first using `html-to-image`, then embed)
4. Account Snapshot per module (table format)
5. Change Requests (highlighted rows)
6. CPQ: G/B/B per brand list

### Go-Live Report PDF
Structure:
1. Cover page: "Go-Live Configuration Report", date, generated by
2. Full account config at go-live
3. Diff section: Added / Changed / Removed per module (color coded)

**PDF Generation approach:**
- Generate server-side in `/api/customer/[token]/submit/route.ts`
- Upload to Supabase Storage (bucket: `reports`)
- Store URL in `submissions.pdf_url`
- Attach as buffer to Resend email

---

## 17. ADMIN PANEL SPEC

### `/admin/login`
- Simple password form
- Validates against `ADMIN_PASSWORD` env var
- Sets a signed JWT cookie (24h expiry)
- Redirects to `/admin`

### `/admin` (Dashboard)
- Table of all sessions: org name, customer email, SA, status badge, created date, actions
- Status badges: Pending (grey) | In Progress (blue) | Submitted (amber) | Live (green)
- Actions: View, Copy Customer Link, Generate Go-Live Report (only if status = submitted)

### `/admin/new` (Create Session)
- Form fields:
  - Customer Organisation Name (required)
  - Customer Email (required)
  - SA / BA Email (required, pre-fill from last used if possible)
  - Zuper API Key (required, password input)
  - DC Region (select: us-east-1 | eu-west-1 | ap-south-1 | ap-southeast-1)
- On submit:
  1. Create session in Supabase
  2. Trigger snapshot fetch in background (don't block UI)
  3. Show: "Session created! Customer link: [compass.zuper.co/w/{token}]" with copy button
  4. Option to send the link directly via email to the customer

### `/admin/session/[id]`
- All session details
- Customer's responses
- Change requests
- Snapshot (collapsible)
- Go-Live Report section (with Generate button)

---

## 18. DESIGN SYSTEM

> **The design language is defined in `DESIGN.md` at the project root. That file is the single source of truth. The rules below are a mandatory summary — read DESIGN.md in full before writing any UI.**

### Non-negotiable rules (apply to every component, every phase)

| Rule | Detail |
|---|---|
| Page background | `bg-[#FAF9F7]` — never `bg-gray-100` or `bg-white` for pages |
| Card / panel | `bg-white rounded-2xl border border-[#E5E2DC]` — no shadows |
| Border colour | `border-[#E5E2DC]` everywhere — never `border-gray-200` |
| Primary action | `bg-orange-500 hover:bg-orange-600` — orange is the only interactive colour |
| Button shape | `rounded-full` for all CTAs — never `rounded-md` or `rounded-lg` |
| Text primary | `text-[#1A1A1A]` for headings/values |
| Body text | `text-sm text-gray-500 leading-relaxed` |
| Section labels / eyebrows | `text-[11px] font-bold uppercase tracking-widest text-gray-400` |
| Field labels | `text-xs font-semibold text-gray-500 uppercase tracking-wide` |
| Inputs | Container-label card pattern: `bg-white rounded-2xl border border-[#E5E2DC] px-5 py-4 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all` |
| Icons | Inline SVG only — `stroke="currentColor"`, `strokeWidth={1.5}` or `2`, `strokeLinecap="round" strokeLinejoin="round"`. **No Lucide, no icon libraries.** |
| Emojis | **Never.** Not in UI, not in toasts, not in labels. |
| Heading case | Sentence case only — never Title Case or ALL CAPS (except field labels) |
| Header | `bg-white border-b border-[#E5E2DC] h-16` with `max-w-[760px] mx-auto` inner |
| Max content width | `max-w-[760px]` |
| Progress bar | `bg-orange-500` fill on `bg-[#E5E2DC]` track |
| Toast | Bottom-center, `bg-[#1A1A1A] text-white rounded-2xl` |
| Spinner | `border-2 border-orange-500 border-t-transparent animate-spin rounded-full` |

### Flow node colours (React Flow, Phase 4)
```
job node:         bg-[#EFF6FF] border border-blue-200
external node:    bg-[#F0FDF4] border border-green-200 border-dashed
integration node: bg-[#FFF7ED] border border-orange-200
action node:      bg-[#FAF5FF] border border-purple-200
start/end node:   bg-[#1A1A1A] text-white
```

---

## 19. BUILD PHASES (Build in this order)

### Phase 1 — Foundation
1. Init Next.js 14 project with TypeScript + Tailwind
2. Set up Supabase project, run `schema.sql`
3. Configure `.env.local` with all variables
4. Create `lib/supabase/client.ts` + `lib/supabase/server.ts`
5. Create `lib/zuper/api.ts` with all Zuper fetch functions
6. Create `lib/zuper/transformer.ts`
7. Verify: call `fetchZuperSnapshot()` with a real org API key + `us-east-1`, log the output — confirm categories have nested statuses, checklists have items, notifications have category+status names

### Phase 2 — Admin Panel
1. `app/admin/login/page.tsx` + auth API route
2. `app/admin/page.tsx` — session table
3. `app/admin/new/page.tsx` — create session form
4. API route: `POST /api/admin/sessions`
5. API route: `GET /api/zuper/[token]/snapshot` — fetch + store snapshot
6. Verify: create session, fetch snapshot, view in Supabase

### Phase 3 — Customer Wizard Shell
1. `app/w/[token]/page.tsx` — load session + snapshot
2. `WizardShell.tsx` — progress bar, step navigation, gamification state
3. `WizardStep.tsx` — Framer Motion wrapper
4. `WelcomeStep.tsx`
5. Verify: load wizard from customer link, see welcome step

### Phase 4 — Questions + Flow
1. `QuestionsStep.tsx` — renders from `lib/questions.ts` dynamically
2. `FlowStep.tsx` + `CompassFlow.tsx` — React Flow implementation
3. `lib/flow/variants.ts` — connect answers to nodes
4. Verify: answer questions, watch flowchart update in real-time

### Phase 5 — Snapshot + Modules
1. `SnapshotStep.tsx` + all module components
2. `lib/configMatrix.ts` — badges per module
3. `CPQModule.tsx` — static G/B/B per brand
4. API route: `GET /api/zuper/[token]/workflows` + single workflow
5. `lib/ai/explainWorkflow.ts` — Claude API integration
6. Verify: modules render live data, workflows show plain English

### Phase 6 — Submit + Email + PDF
1. `ReviewStep.tsx`
2. API route: `POST /api/customer/[token]/submit`
3. `lib/pdf/OnboardingReport.tsx`
4. `lib/email/OnboardingEmail.tsx`
5. Set up Resend, verify email delivery
6. `app/w/[token]/submitted/page.tsx` with confetti

### Phase 7 — Go-Live Report
1. `lib/pdf/GoLiveReport.tsx`
2. `lib/email/GoLiveEmail.tsx`
3. API route: `POST /api/admin/go-live/[id]`
4. `GoLiveButton.tsx` in admin panel
5. `/admin/session/[id]` — full session detail page

### Phase 8 — Polish
1. Mobile responsiveness
2. Error states (API down, invalid token, already submitted)
3. Loading skeletons
4. Edge case: customer revisits after submit → show their previous responses + "Update your requests" option
5. Rate limit Zuper API calls (don't hammer on every page load — use cached snapshot from Supabase)

---

## 20. KEY IMPLEMENTATION NOTES

### API Key Security
**NEVER** pass the Zuper API key to the browser. All Zuper API calls happen in Next.js API routes (server-side). The customer-facing pages receive transformed data, not raw API responses.

Flow:
```
Browser → Next.js API Route → Zuper API
Browser never sees the API key.
```

### Snapshot Caching
When the wizard loads (`GET /api/customer/[token]`), return the snapshot from Supabase, **not** a fresh Zuper API call. This prevents rate limiting and ensures the customer always sees consistent data.

The SA can trigger a fresh snapshot from the admin panel if needed.

### React Flow Performance
For the flowchart, use `useNodesState` and `useEdgesState` from `@xyflow/react`. Recompute the variant inside a `useEffect` that watches the answers object. Wrap the ReactFlow component in a fixed-height container (e.g. `h-[500px]`).

### Question Paging (for 50+ questions)
The `QuestionsStep` internally divides visible questions into pages of 6. It tracks a `pageIndex` state. The parent wizard step does not advance until all pages within Step 1 are completed. This keeps the wizard step count small while supporting many questions.

### Workflow AI Explanations
Don't block the snapshot fetch on AI explanations. Fire the workflow detail fetches + Claude calls in the background after the snapshot is stored. Store results in `snapshots.workflow_explanations` as `{ [workflow_uid]: { headline, description, saves } }`. The frontend polls or fetches lazily when the Workflows module tab is opened.

### SurveySparrow Future Migration
When SurveySparrow is integrated, it will webhook to `POST /api/customer/[token]/survey-response`. Store the raw SurveySparrow response in a new `survey_responses` table. Map the relevant answers to the same `question_id` keys in `lib/questions.ts`. The flowchart and snapshot steps remain unchanged — they just read from a different data source.

### Change Request Auto-save
Each module's change request textarea should `debounce` saves (500ms) to `POST /api/customer/[token]/change-request` with `{ module, request_text }`. This ensures nothing is lost if the customer closes the tab before hitting submit.

---

## 21. PACKAGE.JSON DEPENDENCIES

```json
{
  "dependencies": {
    "next": "14.2.x",
    "react": "^18",
    "react-dom": "^18",
    "typescript": "^5",
    "@supabase/supabase-js": "^2",
    "@anthropic-ai/sdk": "^0.24.0",
    "@xyflow/react": "^12",
    "@react-pdf/renderer": "^3",
    "react-email": "^2",
    "@react-email/components": "^0.0.19",
    "resend": "^3",
    "framer-motion": "^11",
    "lucide-react": "^0.383.0",
    "canvas-confetti": "^1.9.3",
    "html-to-image": "^1.11.11",
    "clsx": "^2",
    "tailwind-merge": "^2",
    "date-fns": "^3",
    "jose": "^5"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/canvas-confetti": "^1",
    "tailwindcss": "^3",
    "autoprefixer": "^10",
    "postcss": "^8"
  }
}
```

---

## 22. VERCEL DEPLOYMENT

1. Push to GitHub
2. Import in Vercel, select the repo
3. Add all env vars from `.env.example` to Vercel project settings
4. Deploy — zero config needed for Next.js
5. Add custom domain: `compass.zuper.co` (or whatever is available)
6. Set `NEXT_PUBLIC_APP_URL` to the production URL

---

## 23. DONE = DEFINITION OF DONE (MVP)

Before calling this MVP complete, verify:

- [ ] SA can log into admin panel, create a session with API key, get a customer link
- [ ] Fetching snapshot from a real Zuper org works for all 5 modules
- [ ] Customer link loads the wizard with org name pre-filled
- [ ] All 9 base questions render correctly with conditions
- [ ] Changing answers updates the flowchart in real-time
- [ ] All 6 module tabs render live data with correct badges
- [ ] Workflows show AI-generated plain English explanations
- [ ] CPQ module shows G/B/B cards for selected brands
- [ ] Change requests auto-save per module
- [ ] Submit generates a PDF and sends emails to SA + `onboarding@zuper.co`
- [ ] Customer receives confirmation email
- [ ] Supabase has the session row, snapshot row, response rows, change request rows, submission row
- [ ] SA can view all of this in the admin session detail page
- [ ] SA can generate go-live report which triggers the second email to `support@zuper.co`
- [ ] All Zuper API keys stay server-side (audit: grep browser network tab for `x-api-key`)
- [ ] Works on mobile (wizard is fully responsive)
