# Security and Privacy Baseline

**Status:** Design requirements; no application controls exist yet to verify.

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

## Groups, tracker, and protocol privacy

- Squad membership is opt-in, capacity-safe, and reversible via leave flow.
- Explain what peers can see; do not promise peer confidentiality absolutely.
- Keep tracker records and protocol usage private by default. Any future sharing requires explicit, revocable per-member controls.
- Do not retain free-text protocol responses or microphone audio without a documented necessity and explicit disclosure.
- Provide reporting/moderation mechanisms and clear group guidelines once approved.

## Data lifecycle and user rights

Before launch, approve retention/deletion, export, account closure, backups, incident response, and support workflows. Define legal holds and accounting retention separately from private coaching journals. Assess applicable data-protection rules, including Kenya's Data Protection Act where relevant and obligations in countries served. A privacy notice alone is not proof of compliance; obtain appropriate legal review.

## Audit, monitoring, and recovery

- Audit privileged changes such as plan/entitlement modifications, refunds, suspensions, and moderation actions.
- Exclude private journal text and credentials from audit records.
- Monitor application errors, job failures, webhook verification/deduplication, email delivery, and booking/payment state inconsistencies.
- Document backup encryption/access, restore checks, retention, and incident escalation before production.

## Verification requirements

Tests must prove: users cannot access another user's logs; users cannot self-assign roles or paid entitlements; free accounts cannot invoke paid operations; group boundaries hold; unverified/duplicate webhook events cannot grant duplicate access; and unauthenticated users cannot perform admin actions. Add abuse/rate-limit, CSRF, file access, consent/unsubscribe, and deletion tests appropriate to final implementation.
