# Proposed Architecture

**Status:** Phase 0 proposal for a new application; no implementation exists yet.

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

## Proposed defaults, subject to Phase 0 review

- **Web:** Next.js App Router, React, strict TypeScript.
- **Data:** PostgreSQL on Neon as the brief's preferred default; Prisma if compatible with the current framework/deployment choices. Use additive, reviewable migrations.
- **Auth:** Reuse if a suitable system is later found; this workspace is empty. Otherwise select Auth.js or an appropriate alternative during foundation work. No auth choice is installed yet.
- **Hosting:** Prefer an existing arrangement if discovered outside this empty workspace; otherwise Vercel is the brief's default candidate.
- **Email:** Resend is the brief's stated provider, contingent on account, sending-domain verification, and current feature/region suitability. Use one notification service and separate transactional and marketing policy.
- **Scheduled work:** A reliable external scheduler/queue or durable database-backed job pattern must run independently of a browser. Select based on the chosen host and retry/idempotency needs.
- **Payments:** Dedicated provider interface; M-Pesa Daraja is a candidate in the brief. Confirm country, merchant account, recurring billing, international payments, fees, refunds, and webhook model before implementation/activation.
- **Files:** Store the supplied Blueprint/audio in private object storage if restricted delivery is selected; Cloudflare R2 is a candidate from the brief. Do not place secret credentials in client bundles.
- **Calendar:** Start with internal availability/booking unless the owner selects an external calendar; define one authoritative availability source.
- **Monitoring:** Select a host-compatible error/monitoring service only after requirements and privacy implications are assessed.

These are proposed defaults, not verified account capabilities or service commitments. No paid service should be added without an identified requirement.

## Application boundaries

- **Presentation:** Public, member, admin, and distraction-free Panic Protocol layouts share tokens and primitives; panic view suppresses unrelated navigation and upsells.
- **Identity/permissions:** Derive identity from verified server session. A central policy layer checks role, ownership, entitlement, and resource scope.
- **Content:** Public readers receive published lessons only. Admin editing/publishing uses explicit permission checks.
- **Leads/consent:** Blueprint request and marketing consent are separate records/states. Unsubscribe cancels pending marketing work; transactional notices use their own rules.
- **Entitlements/payments:** Product definitions map to entitlements centrally. Only verified, idempotent provider events can confirm payments or grant paid access.
- **Sensitive member data:** Tracker and protocol use are private by default. Admin content privileges do not imply journal access.
- **Jobs/notifications:** A shared service owns enqueue, schedule, delivery attempt, retry, idempotency key, unsubscribe checks, and provider event updates.
- **Bookings/groups:** Concurrency-sensitive operations use database transactions and constraints.

## Route map

### Public

`/`, `/about`, `/resources`, `/resources/[category]`, `/resources/[category]/[slug]`, `/tools`, `/blueprint`, `/pricing`, `/coaching`, `/contact`, `/privacy`, `/terms`, `/refund-policy`, `/login`, `/register`, `/forgot-password`.

### Member

`/dashboard`, `/dashboard/protocol`, `/dashboard/tracker`, `/dashboard/progress`, `/dashboard/learning`, `/dashboard/squads`, `/dashboard/bookings`, `/dashboard/billing`, `/dashboard/settings`, `/dashboard/support`.

### Admin

`/admin`, `/admin/content`, `/admin/resources`, `/admin/leads`, `/admin/members`, `/admin/programmes`, `/admin/squads`, `/admin/bookings`, `/admin/email`, `/admin/settings`.

Implement functional journeys in phase order; do not create empty route shells as a substitute for behavior.

## Design system direction

Inspecting the repository found no existing tokens, font, icon set, or component library. The initial design proposal follows the supplied visual specification: calm navy, teal accent, light reading/dashboard surfaces, high contrast semantic tokens, shared typography/spacing/layout primitives, responsive navigation, consistent accessible forms and status feedback, and a dedicated low-distraction dark protocol. Verify WCAG contrast for actual pairings; adjust token pairings as needed. Do not introduce a UI library before documenting why it is needed. Design implementation is held for review.

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
