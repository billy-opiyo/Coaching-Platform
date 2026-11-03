# Data Model Proposal

**Status:** Phase 0 logical model with a current implementation snapshot. Prisma 7/PostgreSQL schema and additive migrations now cover User, LearningPath, Lesson, LessonProgress, ExternalResource, SecurityEvent, verification/reset tokens, admin audit logs, and time-bounded Entitlement. The owner database has not been configured or migrated.

## Modeling principles

- Normalize identity, content, commerce, consent, private logs, groups, bookings, and operations where their lifecycle/security differs.
- Use stable primary keys, foreign keys, explicit status enums, UTC timestamps, indexes for lookup/scheduling, and constraints for uniqueness/capacity/conflicts.
- Use additive, reviewable migrations. Never reset or destructively seed production.
- Seed only clearly identified fictional development records.
- Minimize sensitive data and define retention/deletion behavior before collecting it.
- Avoid storing raw payment card data or unnecessary protocol responses.

## Logical entities

| Domain | Candidate entities | Key constraints/notes |
|---|---|---|
| Identity | User, UserProfile, Session/AuthAccount (auth-dependent), Role/Permission or equivalent | Unique normalized email; roles set only server-side; account deletion/anonymization policy |
| Learning | LearningPath, ResourceCategory, Lesson, LessonProgress, ExternalResource | Unique slugs; only published resources public; validate media IDs/URLs and safe external schemes |
| Leads/email | Lead, EmailConsent, EmailSequence, EmailSequenceStep, EmailEnrollment, EmailDeliveryAttempt, UnsubscribeToken/record | Separate guide request from marketing consent; unique enrollment/idempotency keys; auditable consent version and time |
| Membership | Product, ProductEntitlement, Order, PaymentTransaction, Subscription, MembershipEntitlement | Currency/amount stored safely; provider IDs unique; entitlements traceable to source and lifecycle |
| Tracker | DailyLog or DailyMetricEntry, optional TrackerMetricDefinition | Owner FK, date/metric uniqueness where applicable, server validation/ranges, private by default |
| Accountability | AccountabilityGroup, GroupMembership, CheckInPrompt, GroupCheckIn, GroupReport | Explicit opt-in; membership history; transactional capacity; group records scoped by membership |
| Coaching | CoachAvailability, Booking, BookingEvent | Transactional conflict prevention; UTC start/end; timezone context; policy-bound cancellation states |
| Operations | WebhookEvent, AuditLog, ScheduledJob/Outbox (if queue requires) | Unique provider event/idempotency key; safe metadata; least-privilege audit access |

The remaining entities are logical suggestions, not a requirement to create one table per line. Combine only when lifecycle, security, and integrity remain clear.

## Initial relationship outline

- User has one profile and many sessions, lesson progress records, tracker records, bookings, group memberships/check-ins, orders, and entitlements.
- Current `User` stores a display name, role, email-verification state, disabled state, session version, and a reversible account-deletion request timestamp. Email remains immutable in profile settings.
- `LessonProgress` is uniquely scoped by user and published lesson. Updates derive the user ID from the verified server session and reject unpublished lessons/paths.
- `Entitlement` is uniquely scoped by user and key, with grant source, optional expiry, and revocation timestamp. Runtime access checks require an active database record; client-supplied role or plan values are not accepted.
- Lesson belongs to a learning path/category; lesson progress uniquely links user and lesson.
- Lead can have consent history and email enrollment/delivery history without requiring a member account.
- Product maps to one or more entitlements; verified purchases/subscriptions grant time-bounded or persistent entitlement records.
- Group membership links user and group with status/join/leave timestamps; check-ins link a membership/group prompt and must not include tracker data implicitly.
- Booking belongs to a member and availability/coach slot; database or transaction guard prevents overlap.
- Webhook event is unique per provider event ID and records processing outcome; audit events capture privileged changes without private journal content.

## Integrity and indexing requirements

- Unique user email, content slug, provider customer/subscription/payment IDs as applicable, provider webhook event ID, job idempotency key, and lesson progress per user/lesson.
- Unique member/date/metric for single-entry tracker metrics; if multiple entries are required, model that explicitly instead of silently overwriting.
- Group maximum capacity enforced transactionally with a database-safe locking/constraint strategy.
- Booking time conflicts prevented transactionally or by an equivalent database constraint supported by the chosen database.
- Foreign-key deletion behavior must be explicit. Account deletion should not accidentally erase financial/audit obligations; apply approved retention rules.
- Index status plus scheduled time for due jobs; owner and date for tracker history; publication status/order for resources; status and time for bookings/payments.

## Unresolved schema decisions

Final pricing, currency, one-time/recurring options, grace periods, entitlement expiry, group eligibility/capacity semantics, timezone preference, metric edit rules, legal retention periods, and provider identifiers depend on owner decisions and selected services. See `business-decisions.md`.
