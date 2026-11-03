# Implementation Plan

**Status:** Active phased implementation. Phases 1–5 are complete and pushed to GitHub; Phases 6–8 remain.

## Phase 0 — Audit and architecture (complete)

- [x] Inspect the workspace before application changes.
- [x] Document existing capabilities and gaps in `implementation-audit.md`.
- [x] Prepare route map, architecture, data model, security, deployment, and business-decision registers.
- [x] Owner reviewed the foundation and authorized continuation. Unresolved business choices remain tracked in `business-decisions.md` and do not block independent work.

## Phase 1 — Foundation and public website

1. [x] Establish a Next.js App Router + React + strict TypeScript application with npm and a documented supported Node runtime.
2. [x] Add a shared responsive visual system and native accessible public navigation.
3. [x] Implement home, about, resources/category/lesson, tools, Blueprint, pricing, coaching, contact, privacy, terms, refund, and account entry pages. Unapproved copy remains identified as sample or unavailable.
4. [x] Add Prisma content models and admin editing/publishing for learning paths, lessons, and curated tools with URL validation.
5. [x] Add noindex-by-default metadata, robots policy, and sitemap gated on public hostname/indexing configuration.
6. [x] Add credential auth, verification/recovery, admin-only content authorization, and audited mutations as a foundation for protected management.
7. [x] Verify the final tree with lint, typecheck, unit tests, Prisma validation, production build, and production dependency audit (zero production vulnerabilities); push the completed Phase 1 commit.

**Current boundary:** PostgreSQL schema and migration are generated and validated locally but have not been applied to an owner database. Database-backed routes, outbound email, and actual admin login require configured secrets, a database, and an owner-verified admin account. Public browser verification does not establish those external integrations.

## Phase 2 — Authentication and member dashboard

1. [x] Implement credentials registration/login, logout/session handling, email verification/password recovery, secure cookies, and hashed auth rate-limit buckets.
2. [x] Add least-privilege roles and a central server-side entitlement record/check with expiry and revocation.
3. [x] Add protected responsive member dashboard, profile/settings, reversible deletion request, and loading/error/empty states.
4. [x] Track lesson completion only for authenticated members; guest access to published resources is preserved.
5. [x] Verify migration/client generation, typecheck, lint, unit tests (7 passed), production build, and anonymous route gating; document the DB-backed integration boundary; push the completed Phase 2 commit.

**Current boundary:** Account deletion requests are recorded and cancellable; final deletion/retention processing is not enabled until the owner approves retention and operational policy. Schema changes have not been applied to a real database, and member flows cannot be authenticated end-to-end without database credentials and a verified member account.

## Phase 3 — Blueprint and email automation

1. [x] Implement minimum-field email capture, email validation, and separate guide request from optional marketing consent; form stays closed until required configuration is ready.
2. [x] Record versioned opt-in/opt-out events, idempotent guide delivery, and unique email enrollment/jobs.
3. [x] Implement private, signed 48-hour PDF access through a route that serves a validated file outside `public`; delivery is gated until the owner supplies the file and sender.
4. [x] Implement editable four-step sequence, authenticated scheduled worker, delivery tracking, retry/idempotency, signed provider webhooks, admin pause/resume, unsubscribe, and configured-retention cleanup.
5. [x] Seed only disabled draft templates; require an admin to replace draft text before enabling. No case study is fabricated.
6. [x] Verify Prisma migration/schema validity and client generation, typecheck, lint, unit tests (14 passed), production build, closed-form behavior without owner credentials; push the completed Phase 3 implementation.

**Current boundary:** Guide requests remain disabled until the owner provides a private PDF path, approves consent wording/version, selects a retention period, configures HTTPS `APP_URL`, Resend sender/API/webhook, database, and scheduler secret. Signup remains separately gated on account policy approval. No real provider, file, database, or scheduler was exercised. A local production-server check confirmed the form is absent and no address is collected while configuration is missing.

## Phase 4 — Panic Protocol and tracker

1. [x] Build an adjustable-anchor two-minute text sequence with pause/exit/restart, text alternative, reduced-motion support, and general urgent-help guidance. Audio remains unavailable until an approved recording is supplied.
2. [x] Build private daily entries, bounded validation, edit/delete/history, weekly/monthly summaries, and charts based only on the member's real entries.
3. [x] Enforce user ownership on every tracker read/mutation; protocol runs in the browser and does not persist use or answers.
4. [x] Verify migration/schema, typecheck, lint, unit tests (17 passed), production build, and anonymous access gates; push the completed Phase 4 implementation.

**Current boundary:** Tracker records are one per member/date and contain mood, energy, stress scores plus an optional note. Automated retention is not enabled pending owner policy approval. The member/database journey requires configured PostgreSQL and an authenticated account; the protocol is a general self-help exercise, not medical care. No approved audio has been supplied.

## Phase 5 — Accountability Squads

1. [x] Implement explicit versioned opt-in, verified-member eligibility, capacity-safe assignment, FIFO waitlist, leave/promotion, and in-app notifications.
2. [x] Add structured weekly check-ins, private reports, platform-admin moderation, squad/member management, and audited privileged changes.
3. [x] Keep tracker data separate; share check-ins only within an active group after an explicit sharing acknowledgment; group and report content is not a chat feed.
4. [x] Verify Prisma schema/client, capacity and waitlist invariants, typecheck, lint, unit tests (21 passed), production build, and anonymous route access; push Phase 5.

**Current boundary:** Squads remain closed until the owner sets `SQUADS_POLICIES_APPROVED=true` and supplies `SQUADS_POLICY_VERSION` and approved `SQUADS_POLICY_TEXT` for community guidelines, sharing notice, and moderation/support procedures. Capacity is configured per group. Only platform administrators can manage groups or review reports. The owner database has not been migrated, so the SQL migration was reviewed against Prisma's schema but could not be applied or verified against PostgreSQL. No group/check-in retention period is configured. Production build passed; anonymous access returned Next's streaming redirect to sign-in. Authenticated database-backed squad flows require owner credentials and remain unverified against a live database.

## Phase 6 — Payments and coaching bookings

1. Confirm country, currency, merchant ownership, M-Pesa/card requirements, one-time/subscription needs, fees, refunds, and provider capability before selecting/activating live payments.
2. Implement product catalogue, server-calculated orders, provider interface, signed webhooks, idempotent payment transitions, and entitlements.
3. Build internal availability and booking first unless a calendar is selected; prevent conflicting bookings transactionally and implement approved cancel/reschedule rules and notifications.
4. Never use browser redirects or test fixtures as production payment proof. Do not enable live collection without explicit owner configuration.

## Phase 7 — Administration and operational controls

Complete secured management for leads/consent, members, products/plans, entitlements, payments, groups, bookings, email templates/status, content/resources, audit logs, and real-data operational metrics. Apply least privilege; admin content permissions do not grant access to private journals.

## Phase 8 — Hardening and release readiness

Complete relevant unit, integration, end-to-end, and security tests; lint/type-check/build; accessibility and responsive checks; database migration review; secret/environment setup; backup/recovery and monitoring; deployment/rollback runbook; and production smoke tests. Deployment or destructive production operations require explicit authorization.

## Cross-cutting acceptance gates

- Every protected operation has server-side authorization and input validation.
- Data ownership, consent, payment, and booking invariants are enforced in storage/transactions, not only in UI.
- Loading, empty, error, disabled, and success states are understandable and accessible.
- Mobile layouts avoid unintended horizontal overflow; keyboard and reduced-motion use work.
- No fake metrics, testimonials, prices, benefits, health claims, payment confirmations, or operational statuses.
- Existing working functionality is preserved (none was present in the audited workspace).
- Phase completion requires data model, server behavior, authorization, error handling, and scoped verification—not merely visible UI.

## Immediate next step

Proceed with Phase 6. Confirm payment and booking business decisions before selecting or activating providers; continue independent catalogue, booking, and administration work without enabling live payments or inventing policies.
