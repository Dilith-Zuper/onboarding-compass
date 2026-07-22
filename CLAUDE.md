# ZUPER ONBOARDING COMPASS — PROJECT GUIDE
> Current-state documentation. Kept in sync with the code — if you change behavior, update this file in the same commit.
> **New to this project? Read `PROJECT_CONTEXT.md` first** — it holds project state, the decision log, hard-won lessons, security posture, the prioritized backlog, and the E2E test playbook. This file covers architecture and house rules.
> Product name: **Zuper Onboarding Compass** · codename `compass`
> Production: https://compass-zuper.vercel.app (Vercel project `compass-zuper`) · GitHub: `Dilith-Zuper/onboarding-compass`

---

## 1. WHAT THIS IS

Replaces the 90-minute SA discovery call for new roofing customers. An SA creates a session with the customer's Zuper API key; the customer opens a unique link, answers guided questions, sees an adaptive flowchart of *their* Zuper workflow, reviews their live account configuration, requests changes inline, and submits. The SA gets a PDF + email digest and walks into a 15–30 min focused session instead of 90 min of discovery.

Two surfaces:
- **Admin** — `/admin` (dashboard + session detail) and `/plan` (session creation). Auth-protected, @zuper.co only.
- **Customer wizard** — `/w/[token]`, public unique URL. `?preview=true` = SA preview mode (nothing saved).

Scope: roofing vertical only. SA applies changes manually post-submit.

**Removed from scope** (do not re-add without asking): go-live reports, AI workflow explanations (Anthropic), Resend, `/admin/new`, lucide-react, completion score.

---

## 2. TECH STACK (actual)

| Layer | Choice |
|---|---|
| Framework | Next.js 14 App Router, TypeScript strict |
| Styling | Tailwind + design tokens (see DESIGN.md — mandatory read before UI work) |
| DB / Storage | Supabase (service-role key server-side only; RLS disabled — MVP) |
| Admin auth | Email OTP → JWT cookie (`jose`), or master-admin password login |
| Flow diagram | React Flow (`@xyflow/react`), positions hardcoded in `CompassFlow.tsx` + `fitView` |
| PDF | `@react-pdf/renderer`, generated server-side on submit |
| Email | **Gmail SMTP via nodemailer** (`GMAIL_USER` + app password) — not Resend |
| Animations | Framer Motion |
| Icons | Inline SVG only — no icon libraries, no emojis anywhere in UI |
| Hosting | Vercel (crons in `vercel.json`) |

---

## 3. KEY DIRECTORIES

```
app/
  admin/login/            OTP + password login
  admin/(dashboard)/      sessions table (+ Progress column), session detail (call prep digest)
  plan/                   session creation (canonical; /admin/new is gone)
  w/[token]/              wizard + submitted page
  api/
    admin/auth            OTP request/verify, master_login, signout
    admin/sessions        list/create (never returns zuper_api_key)
    admin/sessions/[id]/send-invite | reopen
    customer/[token]      session+snapshot+responses (cached, no Zuper call)
    customer/[token]/response | change-request | upload | progress | submit
    zuper/[token]/snapshot  cached; ?force=true requires admin JWT
    cron/keepalive        daily 12:00 UTC — keeps Supabase free tier awake
    cron/reminders        daily 14:30 UTC — nudges stalled sessions (3-day cadence, max 3)
components/
  admin/                  buttons (copy, refresh, send invite, reopen, sign out)
  wizard/                 WizardShell (step state + funnel reporting), steps/, modules/, flowchart/, gamification/
lib/
  auth.ts                 MASTER_ADMIN_EMAILS, roleForEmail, verifyAdminRequest (shared JWT check)
  answers.ts              SHARED answer formatter — the only way to render an answer as text
  questions.ts            master question registry (sections, conditions, dynamic options)
  flow/variants.ts        answers → flowchart nodes/edges
  notifications/derive.ts answers → derived notification list (flow badges + module tabs)
  zuper/api.ts            all Zuper API calls (server-only)
  zuper/workflowDescriptions.ts  curated plain-English copy for GA workflows (name-keyed, punctuation-insensitive)
  email/sender.ts         nodemailer; templates.ts builds invite/reminder/SA/customer HTML
  pdf/OnboardingReport.tsx
  appUrl.ts               server-only base URL (env → request host, never localhost)
  supabase/schema.sql     full schema + migration block at the bottom
```

---

## 4. RESERVED ANSWER KEYS

Responses live in one table keyed by `(session_id, question_id)`. Reserved keys share the namespace:

| Key | Meaning |
|---|---|
| `__customer_name` | first name from Welcome step |
| `__rename:<kind>:<uid>` | inline category/status rename `{ newName, originalName }` |
| `__other:<questionId>` | free text typed when "Other" is selected |

`lib/answers.ts` (`formatAnswer`, `getAnsweredQuestions`, `getAnsweredBySection`) understands all of these plus file uploads and dynamic options. **Never format an answer by hand** — ReviewStep, SA email, PDF, and the admin digest all go through it.

---

## 5. AUTH MODEL

- **OTP flow** (default): `@zuper.co` email → 6-digit code + magic link (10-min TTL, 60s resend rate limit, burned after 5 wrong guesses) → 24h JWT cookie `admin_token` with `{ email, role }`.
- **Master admins** (`MASTER_ADMIN_EMAILS` in `lib/auth.ts`: dilith, anandsub, balaje, ramya) sign in with a password instead. Password = `MASTER_ADMIN_PASSWORD` env var; **until that var is set, it falls back to password == their own email (known-weak, close it by setting the var)**. They always get `super_admin`.
- `super_admin` role = baked-in master list ∪ `SUPER_ADMIN_EMAILS` env var. Currently display-only (header pill); hook for future gating.
- Wizard auth is capability-based: the 48-hex-char `unique_token` in the URL is the credential.
- The Zuper API key is stored plaintext on the session, used server-side only, and **never returned by any API after creation**.

---

## 6. CUSTOMER JOURNEY (wizard steps 0–4)

0. **Welcome** — name capture (persisted as `__customer_name`; returning customers skip to 1)
1. **Questions** — from `lib/questions.ts`, grouped by section, 6 per page, pages never cross sections. Per-question autosave (500ms debounce) with Saving/Saved indicator. Conditional visibility (`condition`/`conditions` AND logic, `requiresSessionFlag` for Zuper Connect), dynamic subtexts, `optionsFromQuestion`, optional `link` field rendered as a button (used for the A2P 10DLC registration form). Zuper Connect follow-ups: number porting (number + current provider) when keeping an existing number, and 10DLC form confirmation whenever Connect is activated.
2. **Flow** — `computeFlowVariant(answers)`: lead sources fan into Lead/Customer created → optional HubSpot or Lead Qualification → Inspection → optional Insurance claim → CPQ (measurement providers feed in) → Proposal → Material ordering (suppliers fan out) → Production → Job complete → Invoicing & closeout. Zuper Connect parallel. Notification badges per node from `lib/notifications/derive.ts`.
3. **Account snapshot** — 6 modules (categories, statuses, checklists, notifications, workflows, CPQ) over the cached Supabase snapshot; `max-w-[1100px]` with two-column card grids on md+; each module header carries a plain-English "what is this + why you care" explainer for Zuper newcomers; automations grouped by journey stage (`workflowStage` in `lib/zuper/workflowDescriptions.ts`) with humanized triggers, no node counts; inline rename on categories/statuses; per-module change-request textarea (debounced autosave); polling UI if snapshot not yet fetched.
4. **Review & submit** — labeled Q&A, widget-mode callout, change requests, submit → atomic status claim (double-click safe) → PDF → Supabase Storage `reports` bucket → emails (SA digest to onboarding@zuper.co, CC SA, PDF attached; confirmation to customer) → single submission row (resubmits replace it).

Funnel: every step change POSTs to `/api/customer/[token]/progress` → `sessions.last_seen_step` (monotonic). First open stamps `first_opened_at`.

Session statuses: `pending → in_progress → submitted` (`live` exists in types but nothing sets it). Admin can **Reopen for edits** (submitted → in_progress).

---

## 7. ZUPER API (verified endpoints)

Auth: `x-api-key` header. Base `https://{dc_region}.zuperpro.com/api`; workflows use `https://{dc_region}-workflow.zuperpro.com/api` (different subdomain).

| Data | Endpoint |
|---|---|
| Categories + nested statuses | `GET /jobs/category?populate_statuses=true` |
| Notifications | `GET /customer_notification?count=100&page=1` |
| Checklists | `GET /settings/checklist?category_uid={uid}&job_status_uid={uid}` — fetched per category × per status, merged + deduped by uid |
| Workflows list | `GET /workflows?sort=DESC&sort_by=created_at&limit=50&page=1` (workflow subdomain) |

Snapshot is fetched once at session creation (background, fire-and-forget), cached in `snapshots`, and served from cache everywhere. Admin-only `?force=true` re-fetches. Field mappings live in `lib/zuper/transformer.ts` — field names are verified against real responses; do not guess new ones.

---

## 8. ENVIRONMENT VARIABLES

See `.env.example`. Load-bearing notes:
- All env vars that reach `new Headers()` go through `cleanEnv()` (`lib/utils.ts`) — strips BOM/zero-width chars from Windows-pasted Vercel values.
- `CRON_SECRET` is **required** — cron routes reject everything when unset.
- Server components build customer links via `getAppUrl()` (`lib/appUrl.ts`) — env var, else request host. Never hardcode localhost fallbacks.
- `MASTER_ADMIN_PASSWORD` — set it (see §5).

---

## 9. DATABASE

Full schema in `lib/supabase/schema.sql`; migration `ALTER TABLE` block for existing DBs at the bottom of that file. Storage buckets (create manually, public): `reports`, `customer-uploads`.

Supabase free tier auto-pauses after ~3 days idle → transient `PGRST205` errors on wake (self-resolving). The keepalive cron prevents it.

---

## 10. HOUSE RULES

- **Design**: DESIGN.md is the single source of truth. Non-negotiables: `bg-[#FAF9F7]` pages, white `rounded-2xl` cards with `border-[#E5E2DC]`, orange-500 as the only interactive color, `rounded-full` CTAs, inline SVG icons, sentence case, no emojis.
- **Widths**: wizard `max-w-[760px]` (exceptions: Flow step `1400px`, Snapshot step `1100px` — data-dense steps use the screen), admin/plan `max-w-[1100px]` — never mix otherwise.
- **Customer-facing language**: never "contact your SA" — always the session's `sa_email`, fallback `onboarding@zuper.co`.
- **API keys**: no Zuper call outside `lib/zuper/api.ts`; nothing Zuper-related in client components.
- **Answers**: format only via `lib/answers.ts`.
- **Infra changes**: any `ALTER TABLE` / bucket requirement must be flagged explicitly in the response and appended to the migration block in `schema.sql` — Supabase doesn't auto-apply.
- **Changelog**: every commit appends to `## [Unreleased]` in `CHANGELOG.md` (same commit). Versioning per the global policy (0.x, tags, `RELEASING.md`).
- After Vercel deploys, the alias may need `vercel alias set <deployment-url> compass-zuper.vercel.app`.
- No browser-automation tooling here — verify live behavior with curl, and say so.
