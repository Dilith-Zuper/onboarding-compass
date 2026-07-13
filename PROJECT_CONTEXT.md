# PROJECT CONTEXT — ZUPER ONBOARDING COMPASS
> **Read this first.** This is the handoff document: everything a new engineer (or a fresh Claude session) needs to continue from exactly where the project stands. `CLAUDE.md` is the day-to-day operating guide (architecture, house rules); this file is state, history, decisions, and backlog.
> Last updated: **2026-07-13** — after the full-app review, security/data-integrity fix batch, and a 30-check production E2E test.

---

## 1. What this product is

Compass replaces the 90-minute SA discovery call for new **roofing** customers at Zuper. An SA creates a session with the customer's Zuper API key; the customer opens a unique link and:
1. Answers ~24 guided discovery questions (sectioned, conditional, autosaved)
2. Sees an adaptive React Flow diagram of *their* workflow in Zuper
3. Reviews their **live account config** (categories, statuses, checklists, notifications, automations) pulled from the Zuper API, renames things inline, requests changes per module
4. Submits → PDF report + emails to the onboarding team and SA

**Success metric:** time-to-go-live + SA hours saved. Triggered by an exec ask. Every new roofing customer goes through Compass (not opt-in). SA applies changes manually post-submit; **Phase 2 = API-driven config automation** (not started).

Owner: Dilith Dinesh (dilith@zuper.co), Customer Product Management.

---

## 2. Infrastructure inventory

| Thing | Where | Notes |
|---|---|---|
| Production | https://compass-zuper.vercel.app | Vercel project `compass-zuper`, team `dilith-zupers-projects` |
| GitHub | github.com/Dilith-Zuper/onboarding-compass | **Public repo** — see Security notes §6. Git → Vercel auto-deploy connected 2026-07-13 (before that, every deploy was manual `vercel --prod`) |
| Database | Supabase (free tier) | Schema + migration block: `lib/supabase/schema.sql`. All migrations through 2026-07-13 have been run. RLS disabled (service-role key server-side only) |
| Storage buckets | Supabase | `reports` (PDFs), `customer-uploads` (proposal templates) — both public |
| Email | Gmail SMTP via nodemailer | `GMAIL_USER` / `GMAIL_APP_PASSWORD` env vars. Sender is the Gmail address. ~500/day cap — revisit (Resend?) if volume grows |
| Env vars | Vercel project settings + `.env.local` | Inventory in `.env.example`. `CRON_SECRET` is required (cron routes hard-reject without it) |
| Crons | `vercel.json` | 12:00 UTC keepalive (stops Supabase free-tier auto-pause); 14:30 UTC stalled-session reminders |
| Versioning | `CHANGELOG.md`, `RELEASING.md`, git tags | Currently v0.1.0 + a large `[Unreleased]` section ready to cut as v0.2.0 |

---

## 3. Current state (what works, verified in production)

A 30-check end-to-end test was run against production on 2026-07-13 — **all passing**. Verified: session creation (+invite email received), snapshot fetch + cache (7 categories / 20 notifications / 33 workflows from the golden test account), per-question autosave incl. "Other" free text, funnel step reporting, inline category rename, change-request autosave, submit (atomic, duplicate → 409, post-submit writes → 403), PDF generation (166 KB, full snapshot included), SA digest + customer confirmation emails received, redirect to submitted page, status stability after submit.

**Auth:** `/admin/login` defaults to the password form (OTP via "Email me a code instead"). Master admins (password login, always super_admin): dilith, anandsub, balaje, ramya @zuper.co — list in `lib/auth.ts` `MASTER_ADMIN_EMAILS`. All other @zuper.co accounts use email OTP (5 wrong guesses burns the code).

**Admin panel:** dashboard with Progress column (funnel), session detail with call-prep digest (key decisions grid + labeled answers by section), customer renames table, change requests, submission info with time-to-complete, Reopen-for-edits, Send invite, Refresh snapshot (admin-gated force).

**Test data note:** DB was cleaned 2026-07-13 — remaining sessions are 4 old submitted/live test orgs (incl. " Single Job Roofing Golden Account", whose `zuper_api_key` is the working key used for E2E testing — reuse it for future tests).

---

## 4. Decision log (don't relitigate without new information)

| Decision | Rationale | Revisit when |
|---|---|---|
| Master password = the admin's own email (env `MASTER_ADMIN_PASSWORD` unset) | Beta convenience, user decision 2026-07-13 | **At beta exit — set the env var.** Code already supports it |
| AI workflow explanations removed (was Anthropic Claude per spec) | Cut in "no Claude" overhaul (commit a6f230f); workflows show name/trigger/node count | If plain-English explanations become a customer ask again |
| Resend → Gmail SMTP | Practical: no domain verification needed in beta | Volume > ~50 emails/day or deliverability complaints |
| Go-live report feature removed entirely | Scope cut; `live` status still exists in types but nothing sets it | If "time to go-live" measurement needs an end-timestamp — add a manual "Mark live" action |
| `/plan` is the only session-creation page (`/admin/new` deleted) | Single canonical flow | — |
| RLS disabled, Zuper API keys plaintext in DB | MVP; service-role key never leaves server; admin APIs never return the key | Before any external/production-hardening milestone |
| Reminder cadence 3 days, max 3, SA CC'd | First guess; tune with funnel data | After a few weeks of real customers |
| Session creation awaits snapshot + invite (~7s) | Fire-and-forget dies on Vercel freeze (see §5) | If creation feels too slow, move to Vercel `waitUntil()` |

---

## 5. Hard-won lessons (violate at your peril)

1. **Never fire-and-forget in Vercel API routes.** The serverless function freezes after the response; pending fetches/emails silently die. Confirmed twice in prod (snapshot fetch, invite email). Await everything, or use `@vercel/functions` `waitUntil`.
2. **Next.js 14's fetch data cache serves stale Supabase reads** in route handlers. Confirmed in prod: a submitted session reverted to in_progress off a stale `pending` read. The fix is layered — `cache: 'no-store'` wrapper in `lib/supabase/server.ts` (never remove it), `force-dynamic` on customer GET routes, and DB-level status guards (`.eq('status','pending')` on transitions). Keep all three.
3. **Supabase free tier auto-pauses** after ~3 idle days → transient `PGRST205` on wake. The keepalive cron prevents it; don't delete it.
4. **Windows-pasted Vercel env values can contain BOM/zero-width chars** that break `new Headers()` — every env var goes through `cleanEnv()` (`lib/utils.ts`).
5. **Answer rendering has one formatter**: `lib/answers.ts`. Review step, SA email, PDF, and admin digest all use it. Hand-formatting an answer reintroduces the `[object Object]` / raw-value bugs fixed 2026-07-13.
6. **Reserved response keys** share the answers namespace: `__customer_name`, `__rename:<kind>:<uid>`, `__other:<questionId>`. Anything reading responses must skip/handle `__` keys.
7. **Schema changes**: Supabase doesn't auto-migrate. Append `ALTER TABLE` statements to the migration block at the bottom of `lib/supabase/schema.sql` AND tell the owner to run them.

---

## 6. Security notes (current posture)

- **The repo is public** and the master-login fallback (password == email) is readable in source. Anyone who reads `lib/auth.ts` + `app/api/admin/auth/route.ts` can sign into the admin panel as super_admin. Accepted for beta by the owner, but the cheapest fixes are: make the repo private, or set `MASTER_ADMIN_PASSWORD` in Vercel (code already supports it). **Recommend doing at least one before real customer data accumulates.**
- Zuper API keys: stored plaintext in `sessions`, used server-side only, never returned by any API after creation (fixed 2026-07-13 — keep `SESSION_COLUMNS` in the sessions API).
- Wizard auth is capability-based (48-hex token in URL). Upload paths use session id, not the token, so public file URLs don't leak wizard access.
- OTP: 6-digit, 10-min TTL, 60s resend limit, burned after 5 wrong attempts. Comparisons constant-time.
- Cron routes require `CRON_SECRET`; snapshot force-refresh requires admin JWT.

---

## 7. Backlog (prioritized — pick up from here)

**Next up (quality):**
1. Review-step Q&A entries clickable to jump back and edit the answer (edit-in-place) — also the main mitigation for "customer submits wrong answers"
2. Admin "Open as customer" — true read-only view of a submitted customer's wizard (`?preview=true` exists but is a blank preview, not their data)
3. Surface uploaded files as attachments on the SA email (currently link-only in the PDF/digest)
4. Milestone: decide the `live` status story (manual "Mark live" button?) so time-to-go-live has an end-timestamp
5. Mobile pass on the wizard (spec says responsive; never systematically tested)

**Growth / metric:**
6. Funnel reporting view — the data now exists (`first_opened_at`, `last_seen_step`, reminders); an admin page summarizing completion rate, median time-to-complete, and drop-off per step would let the exec ask be answered with numbers
7. SA personal note in the invite email
8. Tune reminder cadence with real data

**Phase 2 (big):**
9. API-driven config automation — apply renames/change requests to the Zuper account automatically instead of the SA doing it manually
10. SurveySparrow webhook ingestion (`POST /api/customer/[token]/survey-response`) if the org ever routes intake through it again — mapping goes to the same `question_id` keys

**Explicitly out of scope (removed, don't rebuild casually):** go-live reports, AI workflow explanations, Resend, completion score, `/admin/new`.

---

## 8. How to test (the E2E playbook)

No browser automation is assumed. The proven approach (2026-07-13) drives the wizard's API surface in UI order:

1. Get a working Zuper API key: read `zuper_api_key` + `dc_region` from the " Single Job Roofing Golden Account" session row.
2. `POST /api/admin/auth` `{action:'master_login', email, password}` with a master admin → cookie. `POST /api/admin/sessions` (org "E2E Test …", customer/SA = your own email) → wizard token. Verify the response does **not** contain `zuper_api_key`.
3. In order: `GET /api/customer/[token]` (session + snapshot cached), save `__customer_name`, save every answer via `POST …/response` (include a multi-select with `'other'` + matching `__other:<qid>` free text), `POST …/progress` steps 0–4, save `__rename:category:<uid>` `{newName, originalName}`, `POST …/change-request`, `POST …/submit`, re-submit (expect 409), save after submit (expect 403), `GET /w/[token]` (expect 307 → `/submitted`).
4. Verify in Supabase: session `submitted` + `first_opened_at` + `last_seen_step=4`, responses incl. `__other`/`__rename`, one submission row with `email_sent=true` and a downloadable `%PDF`.
5. Verify emails arrived (invite, SA digest to onboarding@zuper.co, customer confirmation).
6. Delete the test session row afterwards (cascade cleans children) — otherwise the reminder cron may email it.

Also: `npm run build` is the only CI gate. There are **no automated tests** — `lib/answers.ts`, `lib/questions.ts` visibility logic, and `lib/flow/variants.ts` are pure functions and the highest-value place to start a vitest suite.

---

## 9. Key commits (archaeology shortcuts)

| Commit | What |
|---|---|
| `abe7365` | Initial build (all 8 phases of the original spec) |
| `7aff7bd` → `f245fef` | Password auth → email OTP + magic link |
| `5757d5e` | Major restructure: `/plan`, sectioned questions, notifications derivation, flow ordering |
| `a6f230f` | Phase 2 overhaul: inline rename, tech-view checklists, AI explanations removed, PDF/email rebuild |
| `7bd2aa9`, `ea8f28b` | Master admin password login; expanded to 4 admins |
| `29cea9b` | Full review fix batch: security (key leak, OTP brute force, upload paths), "Other" persistence, shared formatter, funnel, call-prep digest, reminders, reopen |
| `0601867`, `4534eff` | E2E-found prod bugs: stale-cache status corruption, dead fire-and-forget snapshot/invite; password login default |
