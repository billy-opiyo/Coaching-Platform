# Deployment Runbook (Draft)

**Status:** No application or deployment target is configured. This document is a release checklist, not evidence of a deployed service.

## Current state

- Workspace is empty and is not a Git repository.
- No host, domain, database, environment variable names, CI pipeline, monitoring, backups, or external credentials are configured here.
- Vercel and Neon are candidates from the supplied plan, not verified accounts or selected production infrastructure.

## Before implementation is deployed

1. Establish version control and protected main/release workflow; do not commit secrets.
2. Confirm runtime, package manager, framework build, lint, type-check, and test scripts in the scaffold.
3. Select hosting, domain, database, email sending domain/provider, scheduler, file storage (if required), payment provider, and monitoring based on approved business requirements.
4. Create isolated development, preview/staging, and production resources with least-privilege credentials. Record environment variable **names** in an example file and values only in the secret manager.
5. Verify HTTPS, allowed origins/redirects, secure cookies, webhook endpoints/signatures, email domain records, rate limits, and content security headers.
6. Review additive database migrations, backup/restore plan, retention policy, and a production-safe migration process. Never run reset/seed/destructive operations against production.
7. Verify approved copy, legal/policy text, actual Blueprint PDF, privacy disclosures, product/pricing decisions, and support contacts before public launch.
8. Keep live checkout disabled until merchant/provider setup and payment-state verification are approved.

## Release procedure (to be made host-specific)

1. Review changes and migration SQL; verify the target environment.
2. Run lint, type-check, unit/integration/e2e/security suites, and production build in CI.
3. Apply backward-compatible migration using the selected host/database procedure.
4. Deploy an immutable build to preview/staging; run smoke tests for public pages, auth, protected access, email jobs, storage, webhooks (test mode), bookings, and admin authorization.
5. Confirm monitoring, scheduled job execution, webhook health, email delivery, and rollback target.
6. Promote only through the approved release process. Production deployment requires explicit authorization under the project brief.
7. Run production smoke checks without generating fake purchases or exposing member records.

## Rollback and incident response

- Prefer application rollback to the last known-good build.
- Database rollback must be planned per migration; use forward-fix or compatible rollback steps rather than destructive resets.
- Pause faulty scheduled sends and payment processing through documented operational controls; preserve evidence and idempotency records.
- Escalate privacy/security incidents through an owner-approved response plan and applicable legal timelines.
- Restore from backup only after assessing data-loss window and user impact; record the operation.

## Production readiness evidence to attach later

- Host/project URL and deployment identifier.
- Environment variable names configured (never secret values).
- Database migration/version and restore verification.
- CI test/build result links or logs.
- Monitoring and alert routes.
- Email domain/provider validation and job schedule status.
- Payment test/verification evidence, with live activation separately authorized.
- Backup/restore and rollback exercise results.
- Accessibility, performance, and production smoke test results.
