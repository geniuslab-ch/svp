# Sequel — a private marketplace for acquiring what's next

> **Don't start from zero. Acquire what's next.**
> A curated marketplace where founders list ideas, prototypes, MVPs and early-stage businesses, and acquirers discover them with a swipe, under an alias.

Sequel combines three things:

- a **swipe-based discovery experience**, where a swipe saves interest and is never an offer;
- **verified founders** with four review-based trust levels;
- **pseudonymous acquirers**, who are anonymous to founders but still accountable to the platform.

Zero-revenue ventures are first-class listings. Every figure is labelled verified, founder-reported, estimated, not disclosed or not applicable, and projections are never shown as results.

The brand name lives in one constant, `src/lib/brand.ts`, so you can rename the product in one place.

---

## Stack (free tiers only)

| Concern | Choice |
| --- | --- |
| App | Next.js 15 (App Router, server actions), React 19, TypeScript |
| UI | Tailwind CSS 3, Framer Motion, Geist + Instrument Serif (self-hosted via npm) |
| Database | PostgreSQL via Prisma 6. Hosted on **Supabase** (free) |
| Private files | **Supabase Storage** private bucket; downloads use 60-second signed URLs issued after a server-side permission check |
| Auth | Custom email/password: bcrypt (cost 12), DB-backed sessions storing only the SHA-256 of the token, httpOnly `__Host-` cookie |
| Email | Console driver (logs) or **Resend** (free tier) |
| Hosting | **Render** free web service (`render.yaml` blueprint) |
| CI | GitHub Actions: lint, typecheck, unit/integration tests on Postgres, production build, Playwright E2E |

## Quick start (local)

Requirements: Node 20.11+ (22 recommended) and PostgreSQL 14+ (local or Docker).

```bash
npm install
cp .env.example .env              # adjust DATABASE_URL / DIRECT_URL
npx prisma migrate deploy         # or: npm run db:migrate (dev)
npm run db:seed                   # demo data, clearly labelled "Demo"
npm run dev                       # http://localhost:3000
```

Demo accounts (password `demo-password-1`, shown on the sign-in page while `DEMO_MODE=true`):

| Email | Role |
| --- | --- |
| `founder@demo.sequel.test` | Founder (identity verified, L4 on *Ledgerline*) |
| `founder2@demo.sequel.test` | Founder (identity pending) |
| `buyer@demo.sequel.test` | Buyer, alias “Northwind Holdings” |
| `buyer2@demo.sequel.test` | Buyer, alias “Cobalt Operator” |
| `admin@demo.sequel.test` | Administrator |

With `EMAIL_DRIVER=console`, verification and password-reset links are printed to the server log.

### Creating a real administrator

Admin rights can never be granted through the web app. Use the CLI:

```bash
npm run make-admin -- you@example.com                                # promote an existing account
ADMIN_PASSWORD='a-long-password' npm run make-admin -- you@example.com --create
```

## Tests

```bash
createdb svp_test                 # once; or set TEST_DATABASE_URL
npm run lint && npm run typecheck
npm test                          # 41 unit + integration tests (Vitest, real Postgres)
npm run build && npm run db:seed
npx playwright test               # 8 end-to-end tests against the production build
```

The suites cover authentication, role separation, listing lifecycle and validation, pre-revenue listings, revenue labelling, ARR rules and swipe persistence. They also check that confidential data is never exposed: teaser serialization, filter leakage, direct document/API requests, NDA gating, and revocation. Buyer anonymity, verification levels, admin moderation and upload validation are tested too.

## Deploying (GitHub → Render + Supabase)

1. **Supabase** (free project):
   - Project Settings → Database → copy the **Transaction pooler** URI (port 6543). Append `?pgbouncer=true&connection_limit=1` and use it as `DATABASE_URL`.
   - Copy the **Session pooler** URI (port 5432) and use it as `DIRECT_URL`.
   - Storage → create a **private** bucket named `sequel-private`. Keep it private, with no public policies.
   - Project Settings → API → copy the project URL (`SUPABASE_URL`) and the `service_role` key (`SUPABASE_SERVICE_ROLE_KEY`). This key must only ever live in Render's environment.
2. **Render**: New → Blueprint → select this repository. Render reads `render.yaml`.
   - Fill in the secret variables marked `sync: false`.
   - Set `APP_URL` to the Render URL, e.g. `https://sequel-marketplace.onrender.com`.
   - The build runs `prisma migrate deploy`, and health checks hit `/api/health`.
3. Seed demo data once, optionally, from your machine: `DATABASE_URL=… DIRECT_URL=… npm run db:seed`.
4. Create an admin with `npm run make-admin` (same env vars).
5. Before inviting real users:
   - set `DEMO_MODE=false`;
   - configure Resend (`EMAIL_DRIVER=resend`, `RESEND_API_KEY`, `EMAIL_FROM` on a verified domain);
   - delete demo accounts.

Free-tier notes:
- Render free services sleep after ~15 minutes idle, so the first request is slow.
- Supabase free projects pause after a week of inactivity.
- Render's filesystem is ephemeral, which is why local file storage is refused in production.

## Architecture

```
prisma/schema.prisma      data model (users, profiles, ventures, metrics, documents, requests,
                          conversations, offers, pipeline, verification, reports, audit log, rate limits)
src/lib/authz.ts          pure authorization policy: who may see teaser / details / data room
src/lib/services/*        all business logic; takes an actor, enforces permissions, unit-tested
src/lib/services/ventures.ts  TEASER_SELECT: public queries never load confidential columns
src/app/actions/*         thin server actions → services
src/app/api/*             document downloads (permission-checked + audited), health, data export
src/components/*          design system, swipe deck, wizard, dashboards
```

Key rules enforced on the server:
- **Swipe ≠ offer.** Saving creates a private pipeline entry only. No notification, no identity disclosure.
- **Three information tiers.**
  - *Teaser*: public, or signed-in only for Stealth listings.
  - *Details*: needs an approved request, plus the NDA if the listing requires it.
  - *Data room*: needs a separate approval and expires after 90 days.
  - Founders can revoke access, and every document access is audited.
- **Filters can't leak.** Price and revenue filters use derived columns computed only from public-tier data.
- **Verification is cumulative and review-based.** Uploads never raise a badge. Approvals expire. Only an L4 financial review can mark figures "Verified", and editing a verified figure removes the label.
- **ARR** is shown only for recurring subscription-type revenue, from historical MRR, and is always labelled "annualised".
- **Buyers** appear to founders only as their alias plus the fields they chose to disclose.

## What is implemented vs. placeholder

**Implemented and tested:**
- landing page, swipe discovery (touch, mouse, keyboard, undo), grid/list browse with 11 filters and 5 sorts;
- venture pages with tiered disclosure, the 11-step listing wizard (drafts, edit, pause, sold, delete) and private document uploads;
- founder dashboard, verification center (4 levels) and request review (approve/decline/revoke);
- buyer onboarding with alias and disclosure controls, pipeline with private notes, saved/history/requests;
- messaging, non-binding offers (expression of interest / indicative), notifications and email preferences;
- settings: password, data export, account deletion;
- admin: verification review, listing moderation, reports, user suspension, audit log, stats;
- rate limiting, CSP and security headers, 404/error pages, health check.

**Placeholders / not yet built:**
- **Legal documents.** Terms and Privacy are drafts and must be reviewed by counsel. The platform NDA wording is a draft.
- **Identity verification is a manual review.** No IDV provider (e.g. an eID/KYC vendor) is integrated. `VerificationRequest.provider` is ready for one.
- **Payments and monetization.** No payment provider is connected and nothing is charged. `featured` placement exists, admin-controlled.
- **Binding offers and e-signatures.** Not supported, by design.
- **Supabase Storage and Resend drivers** follow the providers' documented REST APIs but could not be exercised here without credentials. Verify an upload and an email after configuring them.
- **No real-time messaging.** Pages refresh on send. No antivirus scanning of uploads (type and magic-byte checks only).

See [`docs/SECURITY.md`](docs/SECURITY.md) for the security model, remaining risks and open legal questions.

## License

Proprietary. All rights reserved (placeholder; see `LICENSE`).
