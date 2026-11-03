# Security and Privacy Baseline

**Status:** Security baseline and implementation snapshot. Auth.js credential sessions, verified-email login, password hashing, rate-limit buckets, server-side role/ownership checks, token hashing, safe resource URLs, database-backed entitlement reads, and gated Blueprint consent/delivery controls are implemented. The owner database/provider and production behavior remain unverified.

## Sensitive data and minimization

Treat account data, behavior-related activity, tracker records, reflections, group participation, and coaching bookings as sensitive. Collect only data required for an explicit feature. Do not put private details, emails, tokens, or behavior-related information in URLs, public metadata, analytics, or routine logs. Do not send tracker/reflection content to advertising or analytics providers.

## Identity and authorization

- Authenticate on the server using a verified session; configure secure, HttpOnly, SameSite cookies and expiration/renewal policy.
- Apply server-side permission checks to every protected read and mutation. Derive user ID/role/entitlement from trusted session/database state, never request payloads.
- Enforce record ownership for tracker, progress, bookings, and group data.
- Keep guest, free member, paid member, coach/content admin, and platform admin permissions explicit and least privileged.
- Admin access to content management must not imply access to private journals.
- Add rate limits to authentication, password recovery, lead capture, and other abuse-sensitive endpoints. Protect state-changing requests from CSRF as appropriate.

## Input, web, and secret handling

- Runtime-validate inputs, URL schemes, redirects, lengths, numeric ranges, and state transitions.
- Use safe framework rendering; never execute arbitrary lesson HTML. Validate YouTube embeds and external links.
- Apply security headers/CSP appropriate to the final integrations; avoid unsafe inline script exceptions where possible.
- Keep secrets in server-side deployment settings. Never commit `.env` values, put secrets in public/client variables, or log credentials/tokens.
- Restrict database credentials and storage access. Use time-limited access for private files if that model is selected.

## Financial integrity

- Never store raw card details.
- Calculate prices and create orders on the server.
- Verify provider webhook signatures and deduplicate event IDs.
- Grant/revoke entitlements through an explicit, idempotent state machine based on verified provider events and approved policy.
- Browser redirects and unverified fixtures are never proof of payment.
- Keep live payment activation gated on merchant configuration and owner approval.

## Consent, email, and jobs

- Record guide requests separately from optional marketing consent, including consent wording/version and timestamp.
- Clearly distinguish transactional notifications from marketing messages.
- Validate unsubscribe tokens securely, suppress/cancel pending marketing sends, and prevent duplicate delivery during retries.
- Use a durable scheduler/queue independent of a browser; log safe delivery metadata and avoid sensitive body content in logs.
- Blueprint capture fails closed unless the private PDF, approved consent version, owner-selected retention, HTTPS public URL, database/auth credentials, Resend configuration, and scheduler/webhook secrets are present. The submitted email is not stored while this gate is closed.
- Guide access tokens are signed, short-lived, stored only as hashes, and exchanged through a no-store POST route; the PDF must be outside `public`, is signature/size checked, and each token has a capped download count.
- Email jobs have unique enrollment/step and idempotency keys, claim locks, bounded retries, and provider message IDs. A global pause control starts enabled. Sequence sends re-check the latest append-only consent event/version and stop if consent no longer matches.
- Resend webhook signatures are checked against the raw request body and provider event IDs are deduplicated. Lead and event cleanup runs from the authenticated scheduler using the configured retention period while preserving active sequences and unexpired links.
- Account creation separately remains closed until `ACCOUNT_POLICIES_APPROVED=true`.

## Groups, tracker, and protocol privacy

- Squad membership is opt-in, capacity-safe, and reversible via leave flow.
- Explain what peers can see; do not promise peer confidentiality absolutely.
- Tracker check-ins are scoped by the authenticated user on every query and mutation, unique per member/date, and can be edited or deleted by that member. Do not expose notes to content administrators or analytics. The browser-only protocol does not persist use or answers.
- Do not retain free-text protocol responses or microphone audio without a documented necessity and explicit disclosure.
- Provide reporting/moderation mechanisms and clear group guidelines once approved.

## Data lifecycle and user rights

Members can record and cancel an account-deletion request, but no destructive account deletion runs yet. Tracker entries are individually editable/deletable; automated tracker retention and account deletion processing require an approved policy and operations flow. Blueprint lead cleanup is implemented but cannot run until the owner selects a retention period and configures the authenticated scheduler. Before launch, approve retention/deletion, export, account closure, backups, incident response, and support workflows; then implement and verify processing through administration. Define legal holds and accounting retention separately from private coaching journals. Assess applicable data-protection rules, including Kenya's Data Protection Act where relevant and obligations in countries served. A privacy notice alone is not proof of compliance; obtain appropriate legal review.

## Audit, monitoring, and recovery

- Audit privileged changes such as plan/entitlement modifications, refunds, suspensions, and moderation actions.
- Exclude private journal text and credentials from audit records.
- Monitor application errors, job failures, webhook verification/deduplication, email delivery, and booking/payment state inconsistencies.
- Document backup encryption/access, restore checks, retention, and incident escalation before production.

## Verification requirements

Tests must prove: users cannot access another user's logs; users cannot self-assign roles or paid entitlements; free accounts cannot invoke paid operations; group boundaries hold; unverified/duplicate webhook events cannot grant duplicate access; and unauthenticated users cannot perform admin actions. Add abuse/rate-limit, CSRF, file access, consent/unsubscribe, and deletion tests appropriate to final implementation.
