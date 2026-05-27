# Changelog

All notable changes to Onboarding Compass are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). The 0.x line is pre-stable — breaking changes may land in minor bumps.

## [Unreleased]

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
