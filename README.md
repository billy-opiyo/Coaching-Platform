# Coaching Platform

A phased web platform for educational resources, coaching, and member tools. The current implementation includes the public foundation, member dashboard, and a gated Blueprint email automation foundation. Squads, payments, and bookings remain future phases.

## Requirements

- Node.js 20.19+, 22.12+, or 24+
- npm

## Local development

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

## Checks

```powershell
npm run lint
npm run typecheck
npm run test:unit
npm run build
```

## Environment

Set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_INDEXING_ENABLED=true` only after the hostname, public copy, and resources are approved. Without both values, the site emits a disallow-all robots policy, noindex metadata, and an empty sitemap. Database-backed account and admin flows also require `DATABASE_URL`, `AUTH_SECRET`, and the email settings documented in `.env.example`.

## Project status

Phases 1–4 are implemented; Phase 4 is being pushed. See [`docs/implementation-plan.md`](docs/implementation-plan.md), [`docs/implementation-audit.md`](docs/implementation-audit.md), and [`docs/business-decisions.md`](docs/business-decisions.md). Public copy and learning topics are sample material until owner approval. The site is configured not to be indexed until the public hostname and indexing approval are supplied. No payments or bookings are live. Blueprint capture remains disabled until the owner supplies and approves the required private PDF, email, consent, retention, database, and scheduler configuration. Tracker retention requires a separate owner policy. Database-backed behavior requires a configured PostgreSQL `DATABASE_URL`; authentication also requires `AUTH_SECRET` and `AUTH_TRUST_HOST=true` only behind a trusted host/proxy. No production database or credentials are included.
