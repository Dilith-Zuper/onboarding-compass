# Changelog

All notable changes to Onboarding Compass are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). The 0.x line is pre-stable — breaking changes may land in minor bumps.

## [Unreleased]

### Added
- Super-admin role wired into the JWT (`role: 'super_admin' | 'admin'`) and surfaced as a pill badge in the admin and `/plan` headers. Configured via the new `SUPER_ADMIN_EMAILS` env var (comma-separated). No scoping changes — all admins still see all sessions; the role is a hook for future role-gated features.

## [v0.1.0] - 2026-05-18

### Added
- Baseline tag for existing codebase. Establishes the versioning convention and a rollback anchor; subsequent commits will record their changes here under `## [Unreleased]` and roll into the next dated section at release time.
