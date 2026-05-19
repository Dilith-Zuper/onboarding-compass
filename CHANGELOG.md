# Changelog

All notable changes to Onboarding Compass are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). The 0.x line is pre-stable — breaking changes may land in minor bumps.

## [Unreleased]

### Added
- Super-admin role wired into the JWT (`role: 'super_admin' | 'admin'`) and surfaced as a pill badge in the admin and `/plan` headers. Configured via the new `SUPER_ADMIN_EMAILS` env var (comma-separated). No scoping changes — all admins still see all sessions; the role is a hook for future role-gated features.
- Flow chart now shows lead source nodes (fan-in to "Lead created" / "Customer created" — name driven by whether a Lead Qualification job exists), external measurement-provider nodes feeding into CPQ, and a new "Material ordering" pre-production milestone that fans POs out to selected suppliers.
- Flow chart canvas is now full-page, nodes are draggable, mouse-wheel zoom is enabled, and a mini-map sits in the corner. Positions are computed in `lib/flow/variants.ts` so the layout adapts to selections.
- "Still needed" inline hint above the Continue button on the wizard lists the exact questions blocking the next page so customers aren't stuck guessing.
- Flow chart nodes now show the actual notification subject lines (up to 3 per node, with "+N more" overflow) and a channel-colour dot, replacing the previous "N notifs" count.

### Changed
- `payment_timing` is now multi-select.
- Closeout: the gating yes/no plus follow-up "what do you include?" pair is merged into a single multi-select question ("What do you send to customers after a job is complete?").
- "Job complete" intermediate flow node removed — production now leads straight to invoicing & closeout.

### Removed
- Wizard questions: `widget_website_url`, `sends_pre_job_docs`, `pre_job_docs_what`, `pre_install_reminders`, `uses_digital_payment_tools`, `digital_payment_tools_which`, `invoice_owner`, `payment_notification_recipients`, `payment_failure_recipients`, and the gating `sends_post_job_docs` (now part of the merged closeout question).
- Derived notifications tied to the removed questions (pre-install reminders, pre-job docs, payment-received / payment-failure recipient alerts).

## [v0.1.0] - 2026-05-18

### Added
- Baseline tag for existing codebase. Establishes the versioning convention and a rollback anchor; subsequent commits will record their changes here under `## [Unreleased]` and roll into the next dated section at release time.
