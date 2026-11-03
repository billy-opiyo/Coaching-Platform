# Proposed Architecture

**Status:** Current architecture record. Phases 1–5 public, content-admin, member dashboard, tracker, protocol, and squad foundations are implemented; squads remain closed behind the owner-policy gate. Provider accounts, owner database, and production environment are not configured.

## System shape

One Next.js App Router application should serve the public website, member portal, and admin experience. React and strict TypeScript should be used throughout. Public content can be server rendered; interactive tools can use client components only where needed. Route Handlers and Server Actions must call shared server-side business services, validation schemas, and authorization checks.

```text
Browser
  └─ Next.js application
       ├─ Public pages and published learning content
       ├─ Authenticated member pages and actions
       ├─ Admin pages and privileged actions
       ├─ Domain services (consent, entitlements, bookings, groups)
       ├─ Integration boundaries (email, payments, file storage, calendar)
       └─ PostgreSQL database

Scheduler/queue ──> idempotent notification and maintenance jobs
Providers ──signed webhooks──> verified event handlers ──> domain services
```

## Implemented foundation and remaining provider choices

- **Web:** Next.js App Router, React, strict TypeScript, and npm are installed. Route groups are not needed yet.
- **Data:** Prisma 7 models PostgreSQL. The initial migration is additive and generated; `DATABASE_URL` is unconfigured and no live migration has run. Neon remains a candidate, not a selected/provisioned service.
- **Auth:** Auth.js credentials provider with JWT sessions, bcrypt password hashes, verified-email requirement, single-use verification/reset tokens, session-version invalidation, hashed rate-limit buckets, and database-backed role checks is implemented. Trusted host mode is explicit via `AUTH_TRUST_HOST=true` only behind a trusted host/proxy. Registration remains disabled unless explicitly configured with the required services.
- **Hosting:** No host or deployment configuration was found or selected. Vercel remains a candidate only.
- **Email:** Resend adapter code is present for verification and reset messages. No API key, verified sender, or production sending configuration is supplied.
- **Scheduled work:** A reliable external scheduler/queue or durable database-backed job pattern must run independently of a browser. Select based on the chosen host and retry/idempotency needs.
- **Payments:** Dedicated provider interface; M-Pesa Daraja is a candidate in the brief. Confirm country, merchant account, recurring billing, international payments, fees, refunds, and webhook model before implementation/activation.
- **Files:** Store the supplied Blueprint/audio in private object storage if restricted delivery is selected; Cloudflare R2 is a candidate from the brief. Do not place secret credentials in client bundles.
- **Calendar:** Start with internal availability/booking unless the owner selects an external calendar; define one authoritative availability source.
- **Monitoring:** Select a host-compatible error/monitoring service only after requirements and privacy implications are assessed.

Candidates are not verified account capabilities or service commitments. No paid service should be added without an identified requirement.

## Application boundaries

- **Presentation:** Public, member, admin, and distraction-free Panic Protocol layouts share tokens and primitives; panic view suppresses unrelated navigation and upsells.
- **Identity/permissions:** Derive identity from verified server session. A central policy layer checks role, ownership, entitlement, and resource scope.
- **Content:** Public readers receive published lessons only. Admin editing/publishing uses explicit permission checks.
- **Leads/consent:** Blueprint request and marketing consent are separate records/states. Unsubscribe cancels pending marketing work; transactional notices use their own rules.
- **Entitlements/payments:** Product definitions map to entitlements centrally. Only verified, idempotent provider events can confirm payments or grant paid access.
- **Sensitive member data:** Tracker entries are private to the member account. Squad participation is an explicit, versioned opt-in; weekly squad check-ins are shared only with active group peers. Tracker data and protocol use are never copied into a group. Moderation reports are restricted to platform administrators.
- **Jobs/notifications:** A shared service owns enqueue, schedule, delivery attempt, retry, idempotency key, unsubscribe checks, and provider event updates.
- **Bookings/groups:** Concurrency-sensitive operations use database transactions and constraints.

## Route map

### Public

`/`, `/about`, `/resources`, `/resources/[category]`, `/resources/[category]/[slug]`, `/tools`, `/blueprint`, `/pricing`, `/coaching`, `/contact`, `/privacy`, `/terms`, `/refund-policy`, `/login`, `/register`, `/forgot-password`.

### Member

`/dashboard`, `/dashboard/protocol`, `/dashboard/tracker`, `/dashboard/progress`, `/dashboard/learning`, `/dashboard/squads`, `/dashboard/bookings`, `/dashboard/billing`, `/dashboard/settings`, `/dashboard/support`.

### Admin

`/admin`, `/admin/content`, `/admin/resources`, `/admin/leads`, `/admin/members`, `/admin/programmes`, `/admin/squads`, `/admin/bookings`, `/admin/email`, `/admin/settings`.

Public routes listed above are implemented. Account entry, tracker, protocol, email, and content-admin routes exist; squads, payments, bookings, and remaining admin workflows are still phased work. Implement functional journeys in phase order; do not create empty route shells as a substitute for behavior.

## Design system direction

The repository had no existing tokens, font, icon set, or component library. The Phase 1 public design foundation now uses calm navy/teal/light surfaces, shared typography, spacing, cards, buttons, and responsive navigation. Contrast and full accessibility checks remain Phase 8 acceptance work. The dedicated dark protocol and member/admin-wide application of the design system remain in later phases.

## Integration and data flow rules

- Validate all external inputs at runtime.
- Keep shared business logic out of view components.
- Never trust a browser-supplied user ID, role, plan, or payment state.
- Verify webhook signatures against raw request bodies as required by the provider, then deduplicate provider event IDs.
- Use idempotency keys for jobs and provider operations; log safe metadata only.
- Keep secret values server side and out of logs.
- Do not send sensitive tracker data to analytics/advertising systems.
- Use UTC timestamps in storage and display in user/appointment timezones.

## Decisions required before later phases

See [business-decisions.md](business-decisions.md). The highest impact are brand/approved content, product access and prices, free-account scope, target market/payment requirements, email domain/consent policy, privacy/retention and community policies, and calendar/availability ownership.
