# Changelog

All notable changes to Onboarding Compass are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). The 0.x line is pre-stable — breaking changes may land in minor bumps.

## [Unreleased]

### Added
- Curated plain-English descriptions for all 34 GA (golden account) workflows (`lib/zuper/workflowDescriptions.ts`), shown in the wizard's automations module and the PDF report. Matching is name-based (punctuation-insensitive); curated copy wins over the Zuper description, unknown workflows fall back to Zuper's own description.
- Number-porting questions when Zuper Connect is enabled and the customer keeps their existing number: the number itself and the current provider, with copy explaining we'll port it to Zuper. The flowchart's Zuper Connect node description reflects the porting choice.
- A2P 10DLC registration question when Zuper Connect is activated — links to the Microsoft Forms registration form (new `link` field on questions, rendered as a button) and asks the customer to confirm submission.
- SA call-prep digest on the admin session detail page: key-decisions grid (lead qualification, widget mode, insurance, Zuper Connect, deposits, payment timing, suppliers, brands) plus discovery answers grouped by section with real question text and option labels — replaces the raw `question_id` list.
- Funnel instrumentation: `sessions.first_opened_at` and `sessions.last_seen_step` (reported by the wizard on every step change via `POST /api/customer/[token]/progress`). Admin dashboard gains a Progress column; session detail shows Opened and Time-to-complete. **Requires migration SQL — see bottom of `lib/supabase/schema.sql`.**
- Stalled-session reminder cron (`/api/cron/reminders`, daily 14:30 UTC): emails customers whose sessions sit pending/in-progress for 3+ days, SA on CC, max 3 reminders per session, 3-day gap between reminders.
- "Reopen for edits" button on submitted sessions: flips status back to in-progress so the customer can revise and resubmit; resubmission replaces the previous submission row.

### Fixed
- **Stale-cache status corruption** (found by prod E2E test): Next.js 14's fetch data cache could serve stale Supabase reads inside route handlers, knocking a submitted session back to in-progress. All server Supabase calls now bypass the cache (`cache: 'no-store'`), customer GET routes are `force-dynamic`, and the pending→in-progress transition is guarded at the DB level (`.eq('status','pending')`).
- **Invite email silently never sent** (found by prod E2E test): the invite send at session creation was fire-and-forget and died on serverless freeze — now awaited (non-fatal on error).
- **Snapshot never fetched** (found by prod E2E test): the fire-and-forget snapshot fetch at session creation dies when the serverless function freezes after responding. Session creation now awaits the fetch (~5s, non-fatal on error), and the wizard's polling screen triggers one self-healing fetch as a fallback.
- "Other" free-text answers are now persisted (reserved `__other:<questionId>` responses) and shown in the review step, SA email, PDF, and admin digest — previously typed text was silently discarded.
- File-upload answers rendered as `[object Object]` in the review step and SA email; dynamic-option questions (e.g. deposit job types) showed raw values instead of labels. All answer rendering now goes through a shared formatter (`lib/answers.ts`).
- Admin pages no longer fall back to `localhost:3000` for customer links when `NEXT_PUBLIC_APP_URL` is missing — they derive the URL from the request host.
- Double-submit race: the submit route now claims the submitted status atomically, so a double-click can't produce duplicate PDFs/emails/submission rows.
- Wizard autosave upserts atomically on the unique constraint instead of delete+insert (eliminates a duplicate-key race between rapid saves).

### Changed
- Flowchart redesigned to reference-diagram quality: fixed node widths with center-based positioning (nodes now share a truly straight spine — variant x/y are centers, `CompassFlow` converts to top-left), icon chips per node (person, phone, home, shield, calculator, hammer, dollar, …), a dashed "Lead sources" group container around the source fan-out, crisp orthogonal elbows (borderRadius 10) with darker visible strokes, and two-row brick-offset wrapping when more than 5 lead sources are selected.
- Snapshot step scroll + comprehension overhaul (customer feedback): container widened to 1100px with two-column card grids (categories, statuses, notifications, CPQ brands) so laptop screens aren't a narrow scrolling column; every module header now carries a plain-English "what is this and why you care" explainer for customers new to Zuper; automations are grouped by journey stage (Getting leads in, Following up on leads, Scheduling, Quotes, Production, Communication) with humanized "runs when…" triggers instead of raw trigger names and node counts.
- Flowchart refinement: same-row connections (Zuper Connect, website booking, suppliers) now route side-to-side instead of looping top-to-bottom, edges use rounded smoothstep paths with subtler strokes, node cards get a soft shadow, and fan-out spacing is wider so side nodes don't crowd. Zuper Connect is now drawn as an inbound entry channel (calls & texts flow into lead creation).
- Admin login defaults to the password form; email OTP is now the secondary option ("Email me a code instead").
- Added `PROJECT_CONTEXT.md` — repo-resident handoff document (state, decision log, lessons, security posture, backlog, E2E playbook) so anyone can pick the project up cold.

### Security
- Admin sessions API no longer returns `zuper_api_key` to the browser (explicit column selects everywhere).
- Master-admin password moved to the `MASTER_ADMIN_PASSWORD` env var (falls back to the legacy password==email convention until set). Password and OTP comparisons are constant-time.
- OTP brute-force guard: codes burn after 5 wrong guesses (**requires `admin_otps.attempts` column — see migration SQL**).
- Snapshot force-refresh (`?force=true`) now requires an admin JWT; cron routes reject all requests when `CRON_SECRET` is unset.
- Customer uploads: server-side extension allowlist, and storage paths use the session id instead of the wizard token (public file URLs no longer leak wizard access).

### Added
- Three new super admins with password login (no OTP): `anandsub@zuper.co`, `balaje@zuper.co`, `ramya@zuper.co` — same convention as the existing master admin (password == their email). Master-admin list and baked-in super-admin roles now live in `lib/auth.ts` (`MASTER_ADMIN_EMAILS`), merged with the `SUPER_ADMIN_EMAILS` env var.
- Daily Vercel Cron (`/api/cron/keepalive`, 12:00 UTC) requests an admin OTP for `dilith@zuper.co` to keep the Supabase project from auto-pausing on inactivity.
- Master admin password login: `dilith@zuper.co` can sign in on `/admin/login` with a password, skipping the OTP step. All other `@zuper.co` accounts still use email OTP. `dilith@zuper.co` added to `SUPER_ADMIN_EMAILS`. Login page now honours `?next=` for redirect after sign-in (used by `/plan`).

### Fixed
- `admin_otps` table missing `DISABLE ROW LEVEL SECURITY` in `schema.sql`; table was also absent from production Supabase, causing OTP login to fail with a database error.

### Added
- Admin session detail: new "Customer renames" section shows a side-by-side table of original Zuper name vs customer-renamed value, with kind badge (Category / Status). `__rename:*` entries no longer appear raw in the responses list.
- PDF onboarding report: renamed categories and statuses now render with an amber card background and "Renamed" badge, showing `original → new` inline. Section 8 renames summary also uses amber cards.
- `.env.example` updated to reflect actual vars in use: `GMAIL_USER`, `GMAIL_APP_PASSWORD` added; stale `ADMIN_PASSWORD`, `ANTHROPIC_API_KEY`, `RESEND_*` vars removed.
- Inline rename for categories and statuses on the snapshot step — click a tile to edit the name in place; persists via the existing `responses` table under a reserved `__rename:<kind>:<uid>` namespace, surfaced in the PDF report.
- Friendly placeholder rendering for live customer notifications — `{{customer_name}}` etc. show as small inline pills (`Customer name`), unknowns fall back to `[…]`. Shared util in `lib/notifications/templates.ts` powers both the wizard UI and the PDF.
- Checklists rendered as a tech-view preview — each field shown as the control the technician sees in the Zuper mobile app (RADIO → Yes/No pills, TEXT → input mock, PHOTO → camera card, SIGNATURE → sign line, etc.).
- PDF onboarding report now includes the flow chart (captured client-side via `html-to-image`), the live account snapshot (categories, statuses, checklists, active notifications, active workflows, CPQ brands), inline renames, and change requests. Emailed as an attachment to `onboarding@zuper.co` with the SA on CC; customer confirmation goes to the real customer email.
- Super-admin role wired into the JWT (`role: 'super_admin' | 'admin'`) and surfaced as a pill badge in the admin and `/plan` headers. Configured via the new `SUPER_ADMIN_EMAILS` env var (comma-separated). No scoping changes — all admins still see all sessions; the role is a hook for future role-gated features.
- Flow chart now shows lead source nodes (fan-in to "Lead created" / "Customer created" — name driven by whether a Lead Qualification job exists), external measurement-provider nodes feeding into CPQ, and a new "Material ordering" pre-production milestone that fans POs out to selected suppliers.
- Flow chart canvas is now full-page, nodes are draggable, mouse-wheel zoom is enabled, and a mini-map sits in the corner. Positions are computed in `lib/flow/variants.ts` so the layout adapts to selections.
- "Still needed" inline hint above the Continue button on the wizard lists the exact questions blocking the next page so customers aren't stuck guessing.
- Flow chart nodes now show the actual notification subject lines (up to 3 per node, with "+N more" overflow) and a channel-colour dot, replacing the previous "N notifs" count.

### Changed
- Submission emails: report TO is now `onboarding@zuper.co` with the session's `sa_email` on CC (was hardcoded to `dilith@zuper.co`). Customer confirmation TO is now `session.customer_email`.
- CPQ module footer surfaces both the SA email and `onboarding@zuper.co` as contact options instead of falling back to one.
- Notifications module hides inactive notifications entirely instead of dimming them; tab counter reflects active count.
- Workflows module renders the workflow's own `description` field from Zuper instead of a Claude-generated explanation; inactive workflows hidden.
- Categories / Statuses change-request prompts rephrased to "add or remove" (renames now happen inline).
- `payment_timing` is now multi-select.
- Closeout: the gating yes/no plus follow-up "what do you include?" pair is merged into a single multi-select question ("What do you send to customers after a job is complete?").
- "Job complete" intermediate flow node removed — production now leads straight to invoicing & closeout.

### Removed
- Claude-based workflow explanation pipeline: `lib/ai/explainWorkflow.ts`, `lib/ai/prompts.ts`, the async explanation block in the snapshot route, the `/api/zuper/[token]/workflow/[uid]` and `/api/zuper/[token]/workflows` routes, the polling effect in `WorkflowsModule`, and the `plainEnglish` field on `ZuperWorkflowSummary`. The vestigial `snapshots.workflow_explanations` column remains for now (will be dropped in a follow-up migration).
- Status type badge (NEW / STARTED / COMPLETED / …) from the statuses module — added noise without helping the customer.
- Wizard questions: `widget_website_url`, `sends_pre_job_docs`, `pre_job_docs_what`, `pre_install_reminders`, `uses_digital_payment_tools`, `digital_payment_tools_which`, `invoice_owner`, `payment_notification_recipients`, `payment_failure_recipients`, and the gating `sends_post_job_docs` (now part of the merged closeout question).
- Derived notifications tied to the removed questions (pre-install reminders, pre-job docs, payment-received / payment-failure recipient alerts).

## [v0.1.0] - 2026-05-18

### Added
- Baseline tag for existing codebase. Establishes the versioning convention and a rollback anchor; subsequent commits will record their changes here under `## [Unreleased]` and roll into the next dated section at release time.
