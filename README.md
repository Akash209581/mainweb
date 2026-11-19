# ICGIT conference platform

The root application serves the ICGIT conference at `/ICGIT`. It uses Next.js, React, TypeScript, Prisma and PostgreSQL. Public registration, abstract submission, conference content and administrator management are implemented here.

## Repository applications

| Directory | Purpose | Persistence |
| --- | --- | --- |
| Root | Current ICGIT application | PostgreSQL, `storage/`, `public/uploads/` |
| `hansci-novum-admin-portal` | Standalone combined website/admin alternative | SQLite and local files |
| `Hansci/admin-portal` | Standalone private admin backend | SQLite and local files |
| `Hansci_Novum/user-website` | Public website for the separate admin backend; also supplies reference designs | Backend API |

These packages are separate deployment alternatives. Starting one does not synchronize its SQLite database with the root application's PostgreSQL database. Keep their configurations and storage separate. Reference designs are imported through `scripts/import-approved-reference.cjs`; explicit ICGIT branding, verification and checkout adaptations are maintained in `scripts/reference-adaptations.cjs`.

## Local checks

Use Node.js 22 and install with `npm ci`. Copy `.env.example` to `.env`, configure a dedicated development database, then generate the Prisma client with `npm run prisma:generate`. Apply migrations only to an explicitly selected database with `npm run prisma:migrate`; seed only when appropriate for that environment.

- `npm run dev`: development server.
- `npm run typecheck -- --incremental false`: TypeScript checks.
- `npm run lint`: lint checks; imported design files have narrowly scoped exceptions for their existing JavaScript and intercepted anchor navigation.
- `npm test -- --dir test`: root regression tests. Real database and PayPal tests require explicit separate opt-in.
- `node --test Hansci/admin-portal/tests/core.test.mjs hansci-novum-admin-portal/tests/core.test.mjs`: standalone portal core tests.
- `npm run build`: production build. Set `NEXT_BUILD_DIR=.next-build` to verify a build separately from an existing development server's `.next` output. Use the same variable when starting that build.

For ordinary tests and build validation, use unreachable dummy PostgreSQL URLs and keep payment/integration switches disabled. Do not point CI at application databases. CI includes the root suite, portal core tests, typechecking, lint and build.

## Identity and deployment boundaries

The current root identity flow supports the configured administrator session. It does not provide independent author, reviewer or committee-member accounts. Client identity is supplied by the server session; anonymous visitors are signed out. The legacy internal account identifier remains to preserve existing profile and role relationships. Multi-user authentication requires a separate identity integration and migration plan.

Set `PUBLIC_CONFERENCE_SLUG` to select the conference for public database listings. The root app is one conference per deployment; local JSON fallback settings are not a multi-tenant store.

Persist PostgreSQL, `storage/` and `public/uploads/`. Compose includes storage and upload mounts. On Linux, existing bind-mounted directories must be writable by container UID/GID 1001; directory ownership in the image cannot change ownership on the host. Back up database data, settings and files together and verify restoration before deployment. The supplied Compose file expects an external PostgreSQL service and does not apply migrations automatically.

Payment maintenance is a separate operator-managed job: run `npm run paypal:maintain` once per minute using a singleton scheduler with the reviewed application's environment and dependencies available. Database leases protect overlapping work. Monitor its exit status, reconciliation failures and unsent outbox records. The web container alone does not schedule this command.

PayPal Sandbox validation, merchant configuration, live activation and provider refund initiation remain separate milestones. Stripe is explicitly unavailable. Keep checkout/capture/live approval switches disabled until the relevant validation is completed. See `docs/paypal-phase-3-postgres-validation.md` and `docs/paypal-checkout.md`.

Known architectural work remains: database/JSON settings consolidation, independent user identity, replacing imported script execution to tighten CSP, shared caching/rate limits for multiple replicas, and browser accessibility/performance verification. The SQLite alternatives require one persistent server and are not independent-replica deployments.

Payment confirmation email setup and worker operation: see [payment confirmation emails](docs/payment-confirmation-email.md).
