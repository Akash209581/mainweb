# PayPal implementation review — 7 November 2026

**Phase 2 update:** current results and remediation are in [paypal-phase-2-review.md](paypal-phase-2-review.md). Production dependencies now audit clean; six moderate development-only findings remain. Payment/security tests: 117 passed, fifteen integration tests skipped. Root regressions: 197 passed and the same five reference-fidelity failures. Build, TypeScript and Prisma validation passed; existing lint errors remain. New-order, capture, webhook and reconciliation switches are now independent. Snapshot-null, invoice-relation and lease-ownership issues were corrected. No database migration or payment was executed, no secrets rotated, and Live remains disabled. The sections below preserve the original Phase 1 baseline for comparison.

Implementation is prepared for review in the root Prisma application. It is not approved for live payments. Checkout remains disabled by default; no migration, deployment, merchant configuration, or real payment was performed.

## Result

- Added server-priced PayPal Orders v2 checkout with the official browser SDK, opaque guest ownership, strict request validation, CSRF/Origin checks, shared database rate limits and safe errors.
- Added provider order/capture/money/merchant verification, stored idempotency keys, capture leases, conditional state transitions, verified webhook processing and transactional event deduplication.
- New registrations remain pending until verified capture. Payment, registration confirmation, audit and receipt job commit together. Existing registration records are unchanged. Manual confirmation bypasses and mock card-success/refund logic are blocked.
- Fixed automatic admin-session creation and unauthenticated settings mutations; added credential-verified login, restricted cookies, CSRF protection for settings/upload/record mutations, safe upload names and file/body limits.
- Added receipt outbox and a maintenance/reconciliation command. Receipt failure cannot roll back payment confirmation or silently mark delivery successful.

Architecture, threat-to-mitigation matrix, state policy, India restrictions, configuration, webhook registration, backup/restore, reconciliation, monitoring and rollback procedures: [paypal-checkout.md](paypal-checkout.md).

## Historical Phase 1 checks

| Check | Result |
| --- | --- |
| `npm run test:paypal` | 88 passed; 5 integration tests skipped |
| Root regression suite (`npm test -- --dir test`) | 168 passed, 5 failed, 5 skipped; 178 total |
| TypeScript (`npm run typecheck -- --incremental false`) | Passed |
| Prisma client generation and `prisma validate` | Passed |
| Production build | Passed; project configuration skips lint during build |
| Lint (`npm run lint -- --quiet`) | Failed on existing explicit-any, prefer-const and reference-source issues; no errors reported in new payment modules/tests |
| Migration generation/review | Prisma schema diff generated and reviewed; custom constraints, partial unique index and immutability trigger reviewed; not applied/replayed |
| `git diff --check` | Passed |
| Dependency audit | 23 advisories total: 11 moderate, 9 high, 3 critical |
| Production dependency audit | 6 advisories: 5 high, 1 critical |
| Real PayPal Sandbox approval/capture/webhook/refund/reversal | Not executed: no test merchant credentials or approved buyer session supplied |
| Real PostgreSQL constraint/concurrency tests | Not executed: no explicit disposable local test database supplied |

The five regression failures compare unchanged generated reference assets against the separate Hansci Novum originals: registration HTML, abstract HTML, brochure, sessions and committee. Their branding/content already differs. Tests and source fixtures were not rewritten to hide these failures. The default full-repository Vitest discovery also collects three separate Node-test suites under the independent projects/scratch and reports “No test suite found”; the root-only command avoids collecting those incompatible runners. Existing jsdom scrollTo warnings are also present.

The 88 new passing tests cover money parsing and mismatches; order/capture/merchant substitution; domestic/missing payer country; ownership and IDOR; CSRF, input/body limits and mass assignment; SDK redirect/query non-authority; OAuth caching and transport safety; signed-but-unreconciled and forged events; duplicate/stale events; capture and refund-shaped reversal binding; duplicate/concurrent captures; uncertain/lost responses; decline/cancellation; version conflicts; database rollback; administrator credentials/logout; and receipt idempotency/failure/leases. Mocked concurrency is not a substitute for the gated real PostgreSQL tests.

## Schema review

Migration: `prisma/migrations/20261107000100_paypal_checkout/migration.sql`.

Additive changes retain existing tables and statuses. Unique order/capture/request IDs and a partial unique index enforce one lifetime PayPal payment per registration. Webhook/outbox records have payment foreign keys; receipt jobs are unique by payment. The immutable snapshot/identity trigger prevents repricing or order rebinding through later application mistakes. Enum additions occur before transactional DDL; rollback/recovery must account for that. The NOT VALID snapshot constraint protects new/updated PayPal rows without inventing backfills for any legacy records. Preflight existing PAYPAL rows/duplicates and review constraint validation separately. No schema reset or production migration was performed.

## Historical Phase 1 blockers and limits

1. Review/apply the migration in an explicitly approved test environment and run the real PostgreSQL tests. Approve production migration separately after backup/restore validation.
2. Complete real Sandbox buyer approval/capture, negative cases, signed webhook redelivery, refund/reversal and recovery tests. Unit tests do not establish provider interoperability or production safety.
3. Resolve production dependency advisories: Next (critical), nanoid, postcss, sharp, source-map-js and Zod (high). No dependency versions were changed; Zod's audit fix requires a major-version compatibility review.
4. Rotate the old admin signing secret, configure real administrator credentials, verify merchant onboarding/India eligibility and publish actual conference fees/taxes/policies. Historical auto-issued sessions must be invalidated.
5. Provision the maintenance worker separately from the standalone web image; configure TLS/proxy limits, database pooling/least privilege, persistent settings/uploads, alerting and receipt sender verification.
6. Legacy shared admin/reviewer identity design, unsafe-eval reference rendering, broader application logs, public-form abuse controls and local settings across replicas remain outside a complete application security remediation. Guest ownership has no automatic recovery flow. Orders with an uncertain create result beyond the idempotency window require manual reconciliation, never blind replacement.

No claim is made that the application is vulnerability-free or ready for real payments. The reviewed implementation and migration are the deliverables; environment setup and financial deployment remain explicitly gated.

## Changed files

The list below includes application, migration, configuration, tests and documentation; generated build/cache artifacts are excluded.

- .env.example
- actions/registration.actions.ts
- app/(public)/checkout/[registrationId]/page.tsx
- app/admin/page.tsx
- app/api/admin/session/route.ts
- app/api/records/route.ts
- app/api/settings/route.ts
- app/api/upload/route.ts
- app/hanvo/paypal/[registrationId]/route.ts
- app/hanvo/paypal/webhook/route.ts
- components/approved-reference/transport.ts
- components/payments/paypal-checkout.tsx
- components/security/admin-login.tsx
- components/security/admin-portal.tsx
- docs/paypal-checkout.md
- docs/paypal-review.md
- lib/paypal/config.ts
- lib/paypal/maintenance.ts
- lib/paypal/provider.ts
- lib/paypal/service.ts
- lib/paypal/verification.ts
- lib/repositories/write.repository.ts
- lib/security/admin-access.ts
- lib/security/admin-mutation.ts
- lib/security/checkout.ts
- lib/security/headers.ts
- lib/services/email.service.ts
- lib/services/payment.service.ts
- lib/services/registration.service.ts
- package.json
- prisma/migrations/20261107000100_paypal_checkout/migration.sql
- prisma/schema.prisma
- scripts/paypal-maintenance.ts
- test/paypal-admin-security.test.ts
- test/paypal-outbox.test.ts
- test/paypal-postgres.integration.test.ts
- test/paypal-provider.test.ts
- test/paypal-routes.test.ts
- test/paypal-sandbox.integration.test.ts
- test/paypal-security.test.ts
- test/paypal-service.test.ts
- test/paypal-verification.test.ts
- test/registration-pricing.test.ts
