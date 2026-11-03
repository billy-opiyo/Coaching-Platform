# Implementation Plan

**Status:** Active phased implementation. Phase 0 documentation was reviewed by the owner, and the owner authorized continuing through all phases and pushing each completed phase to GitHub. Phase 1 implementation and local acceptance checks are complete; the push is in progress.

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

1. Select and configure auth after checking current compatible options during scaffold; support registration, login/logout, session management, verification/recovery as appropriate, secure cookies, and rate limits.
2. Implement explicit roles/permissions and a central server-side entitlement check.
3. Add profile, protected dashboard, responsive member navigation, settings, account deletion workflow, and honest empty/loading/error states.
4. Track lesson completion only for authenticated members; guests retain published-resource access.

## Phase 3 — Blueprint and email automation

1. Build minimum-field email capture with validation and separate guide request from marketing consent.
2. Record consent version/status and idempotent lead/subscription state.
3. Deliver the owner-supplied PDF using the approved public/private access model; document the launch dependency until the PDF and storage policy exist.
4. Implement editable four-step email sequence, reliable scheduled jobs, delivery-attempt history, retry/idempotency, provider identifiers/webhooks as applicable, admin pause/resume, and unsubscribe suppression.
5. Use educational email content in place of any unapproved case study; no fabricated stories.

## Phase 4 — Panic Protocol and tracker

1. Build configurable two-minute self-help sequence with pause/exit/restart, optional approved audio and text alternative, reduced-motion support, and professional-help guidance.
2. Build private daily entries, validation, edit/delete/history, weekly/monthly summaries, and truthful charts.
3. Enforce ownership on every server operation; keep tracker reflections and protocol use private by default.

## Phase 5 — Accountability Squads

1. Implement explicit opt-in, eligibility, waiting list, transactional assignment, capacity rules, status, leave, and notifications.
2. Add structured weekly check-ins, moderation/reporting controls, and administrator management.
3. Apply approved community guidelines; do not add chat or share tracker data by default.

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

Review Phase 0 documents and resolve scaffold-level choices. Once reviewed, proceed with Phase 1 only. Maintain `business-decisions.md` as decisions become available; continue independent work where possible without inventing policies.
