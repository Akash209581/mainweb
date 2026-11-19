# PayPal checkout implementation and launch review

Prepared 7 November 2026. Target: root Next.js 15 App Router / PostgreSQL / Prisma application, served at `/ICGIT`. Independently deployable Next.js 16 projects were not converted or deployed.

## Current boundary

New checkout is disabled unless `PAYPAL_ENABLED=true` and required configuration validates. `PAYPAL_CAPTURE_ENABLED` independently controls capture and defaults to false. `PAYPAL_WEBHOOK_ENABLED` and `PAYPAL_RECONCILIATION_ENABLED` default to true so disabling new checkout does not strand existing payments. These processing switches still require valid server credentials and the original merchant/environment binding. Live mode additionally requires `PAYPAL_LIVE_APPROVED=true`; do not set this without explicit owner approval. No credentials were changed, migrations applied, live payments processed, or deployment performed during implementation. See [Phase 2 review](paypal-phase-2-review.md) for current verification and setup instructions.

New registrations are PENDING, including when checkout is disabled. Existing registrations are not backfilled or reclassified. Guest registrations receive an opaque HttpOnly/Secure-in-production/SameSite=Strict capability cookie; only its SHA-256 hash is stored. Browser JavaScript never sees that cookie, provider secrets, access tokens, or payer data. Losing the cookie requires support; there is no insecure recovery-by-reference endpoint.

The approved reference UI remains in place. A successful eligible submission navigates to `/ICGIT/checkout/{registrationId}` only when PayPal is enabled. Quote-required categories remain outside checkout. The checkout page uses the official PayPal JavaScript SDK and calls the server to create/capture orders. Registration reference numbers are labels, never authorization.

The existing preview banner and conference policy copy still require owner review before launch. Prices and tax treatment must be approved business values; sample content is not proof of an approved commercial offering.

## India eligibility

PayPal India does not support domestic payments from Indian customers: https://www.paypal.com/in/cshelp/article/can-i-use-paypal-to-receive-payments-from-indian-customers-help1049

Merchant onboarding requires the applicable identity/business verification, email confirmation, PAN, Indian bank account and purpose code: https://www.paypal.com/in/cshelp/article/how-do-i-receive-payments-through-paypal-help667

Confirm account-specific eligibility, business classification, currency acceptance and the appropriate purpose code with PayPal before launch. Do not infer merchant approval from code or Sandbox success. Checkout rejects registrations declaring India and, before capture, requires a non-IN country returned by PayPal. An unavailable payer country fails closed; it is not guessed from an IP address or frontend callback. PayPal remains authoritative for account eligibility.

## Prices and lifecycle

The existing server category/room pricing tables remain the source, with conference-scoped `registration_pricing` overrides. The settings editor now persists its registration and accommodation prices to that canonical database setting. A failed pricing read fails closed while PayPal is enabled. Fixed EUR/USD/GBP tables are not FX conversions. Round each room-night unit price once to integer minor units, then multiply by nights and rooms; reject unsafe/overflowing totals. Browser totals, discounts, status and payer identity are never authoritative.

The registration stores the priced total before checkout. Payment creation snapshots that saved registration price, category and currency before any PayPal request. PostgreSQL protects the payment's snapshot, money, registration, merchant, environment, request keys and already assigned provider identifiers against mutation.

One lifetime PAYPAL payment is permitted per registration, including failed/cancelled/expired orders. This conservative policy prevents order substitution and accidental duplicate payment. There is no automatic replacement policy. An abandoned checkout can resume its existing order if PayPal still permits it; otherwise finance/support must reconcile before any separately approved replacement workflow.

State rules:

| Provider evidence | Payment | Registration |
| --- | --- | --- |
| New order / approval only | PENDING / APPROVED | PENDING |
| Pending capture | PROCESSING | PENDING |
| Independently verified completed capture | PAID | CONFIRMED, atomically with payment/audit/outbox |
| Declined/failed capture | FAILED | PENDING |
| Provider-voided order | CANCELLED | PENDING |
| Full refund | REFUNDED | CANCELLED |
| Partial refund | PARTIALLY_REFUNDED | Existing confirmation retained; a never-confirmed registration remains pending for finance review |
| Verified reversal, including partial reversal | REVERSED | CANCELLED pending finance review |

Closing the SDK does not cancel a provider order or undo a concurrent successful capture. No browser query parameter, redirect, callback payload or event status can confirm a registration. PAID cannot regress to pending/failed; refunded/reversed/cancelled records cannot return to PAID through stale events. Manual registration confirmation is blocked; existing mock card success/refund methods are disabled. No refund initiation API was added: issue approved refunds in the merchant dashboard and reconcile them.

## HTTP and provider boundary

| Endpoint | Purpose |
| --- | --- |
| GET `/ICGIT/hanvo/paypal/{registrationId}` | Ownership-bound status/reconciliation, CSRF token and public client ID |
| POST same path, `{action:"create"}` | Create/reuse server-priced order |
| POST same path, `{action:"capture"}` | Fetch and verify stored order before capture; independently reconcile capture afterward |
| POST `/ICGIT/hanvo/paypal/webhook` | Verify official webhook signature, reconcile and atomically deduplicate/apply |
| GET/POST/DELETE `/ICGIT/api/admin/session` | Login challenge, credential-verified login, CSRF-protected logout |

Checkout JSON is strict and bounded to 4 KB. Webhook JSON is bounded to 256 KB. Cookie-authenticated payment mutations require exact configured Origin and a token derived from the HttpOnly capability. Database request buckets fail closed and coordinate multiple app processes. Rate-limit keys do not trust forwarding headers. The existing gateway/middleware still needs trusted proxy and request timeout configuration.

PayPal requests use fixed, environment-selected HTTPS origins, reject redirects, and time out after 12 seconds. OAuth tokens are server-only and refreshed before expiry. Never follow event links: at most parse a fixed PayPal capture URL to extract an ID. Before capture verify stored order ID, CAPTURE intent, APPROVED state, one purchase unit, internal payment/registration/invoice references, exact original amount/currency and merchant ID. Verify capture membership, ID, amount/currency and any reported payee/order relationship.

Supported create/capture calls use persisted UUID `PayPal-Request-Id` values. Retry an uncertain create only within five hours of the stored payment creation time; later cases require manual reconciliation to stay inside PayPal's default six-hour idempotency retention. An uncertain capture always fetches current order/capture state first; capture retries retain the same key and are blocked beyond five hours from first attempt. Do not clear IDs or request keys to force a retry.

Create/capture coordination uses a database lease; state changes use version-checked updates inside transactions. PayPal and email network calls occur outside database transactions. A stale version or transient failure yields retryable failure rather than an unverified confirmation.

Webhook signatures are verified via `/v1/notifications/verify-webhook-signature` with the exact environment's configured webhook ID. Duplicate event IDs are stored with the state transaction. Relevant unmatched events return retryable failure to cover races with order persistence; unrelated event types are acknowledged without payment mutation. Reversed captures require independently fetching the event using merchant credentials because the capture REST enum does not contain REVERSED. Any financial mismatch fails closed.

References: https://developer.paypal.com/api/rest/reference/idempotency/ ; https://developer.paypal.com/api/rest/webhooks/ ; https://developer.paypal.com/api/payments/v2/definitions/capture_status/

## Threat-to-mitigation review

| Threat | Control / residual concern |
| --- | --- |
| Amount/currency manipulation | Server price snapshot, integer money, strict request schemas, provider comparison, immutable DB fields |
| ID enumeration/IDOR/unauthorized capture | UUID lookup plus guest-cookie hash ownership on every checkout operation |
| Order substitution/wrong merchant | Stored unique order/capture IDs; verify internal references, payee and order/capture membership |
| Duplicate/replayed/concurrent operations | Unique lifetime payment index, persisted provider idempotency, leases, version checks |
| Forged/duplicate/out-of-order webhook | Official verification, independent reconciliation, transactional unique event ID, terminal-state guards |
| Provider/database uncertainty | Fail closed, bounded requests, same-key retry policy, reconciliation worker |
| CSRF/admin privilege escalation | Remove automatic session issuance/fallback secret, credential verification, restricted cookies, Origin and CSRF guards on new payment/login and admin settings/upload/record mutations |
| XSS/injection | Escaped email values, strict checkout inputs, Prisma binding, static provider paths; legacy reference renderer still needs unsafe-eval/inline CSP and further hardening |
| SSRF/open redirect/path traversal | Fixed PayPal URL allowlists, no followed event URLs, internal checkout navigation, generated upload names and bounded member IDs |
| Brute force/DoS/connection exhaustion | Shared checkout/login limits, bounded bodies, Prisma singleton and short transactions; gateway-level limits/timeouts and DB pool sizing remain operational requirements |
| Leaked credentials/PII | No raw PayPal responses or token logs; only provider client ID reaches browser; audit stores internal IDs and transitions; existing application logging still needs broader review |
| Receipt abuse/retries | One outbox job per payment and stable Resend key, leases, bounded retries; ambiguous sends older than 23h require manual review |

## Migration review and database operations

Review `prisma/migrations/20261107000100_paypal_checkout/migration.sql` before applying it anywhere. It adds enum values and nullable fields; new webhook, receipt-outbox and request-bucket tables; foreign keys; unique provider/request IDs; one-PayPal-payment-per-registration partial index; reconciliation index; snapshot constraint and immutability trigger. It does not modify existing registration statuses or totals, reset data, or rewrite the schema.

Use PostgreSQL 12 or later. Enum additions precede a transaction wrapping the remaining DDL. A failed later transaction may leave enum values added; inspect `_prisma_migrations` and follow Prisma's failed-migration recovery process before retrying. Lock and statement timeouts limit blocking. The PayPal snapshot CHECK is NOT VALID to avoid implicitly rewriting/reclassifying legacy provider records; it still enforces new/updated records. Inventory any preexisting PAYPAL rows and duplicates before review, then validate the constraint separately after finance approval. Never delete legacy rows merely to make the migration pass.

The new code requires this schema even with checkout disabled. Deployment must coordinate migration and code; do not release new code against the old schema. Keep runtime database credentials separate from migration credentials, use least privilege, size the connection pool for deployment concurrency, and deny DDL to the runtime role. Take a verified PostgreSQL backup plus persistent uploaded-file/settings backups; restore into an isolated environment and test recovery before production work. No DB migration or restore was executed here.

## Configuration and operator checklist

1. Confirm this root application is the deployed target. Review conference prices, taxes, eligibility, cancellation terms, accommodation terms and privacy copy.
2. Review and approve the migration, backup/restore test, deployment window, and remaining security findings. Test the migration on an isolated PostgreSQL database before production approval.
3. Configure `PUBLIC_APP_ORIGIN` as the exact external origin without `/ICGIT` or trailing slash. Preserve Host/Origin through the proxy, use TLS and restrict spoofable forwarding headers. Set gateway upload/body/connection timeouts and rate limits.
4. Configure `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` and a new random `ADMIN_SESSION_SECRET` of at least 32 characters. The hash format is `scrypt$<16-byte hex salt>$<64-byte hex derived key>`; use Node `scryptSync(password, saltHex, 64)`. Supply the password through a secure interactive prompt or secret manager, never shell history. **Rotate the previous session signing secret before launch** to invalidate sessions the old auto-login code may have issued. Set a separate strong `SUBMISSION_CHALLENGE_SECRET`.
5. Keep sandbox and live credentials, databases and merchant IDs separate. Configure the server-only `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MERCHANT_ID`, `PAYPAL_WEBHOOK_ID`, and `PAYPAL_ENV=sandbox`. No secret belongs in `NEXT_PUBLIC_*`, source control, browser storage or build arguments.
6. In PayPal Developer Apps & Credentials, select the sandbox REST app and register the public HTTPS webhook URL ending `/ICGIT/hanvo/paypal/webhook`. Select CHECKOUT.ORDER.APPROVED/COMPLETED and PAYMENT.CAPTURE.COMPLETED/PENDING/DENIED/REFUNDED/REVERSED as available. Copy that webhook's ID, not its URL, into `PAYPAL_WEBHOOK_ID`. Live must use the separately registered live app/webhook ID.
7. After the schema is applied in an approved test environment, explicitly set both `PAYPAL_ENABLED=true` and `PAYPAL_CAPTURE_ENABLED=true` there; retain webhook/reconciliation switches as true. Complete real SDK approval with an international Sandbox buyer. Test completion, decline, browser close, duplicate capture, provider timeout, webhook redelivery, refund, reversal and database recovery. Never use live credentials for tests.
8. Configure `RESEND_API_KEY` and verified `PAYMENT_EMAIL_FROM`. Schedule `npm run paypal:maintain` at least once per minute with environment variables securely injected. For local testing, Node 22 supports `node --env-file=.env --import tsx scripts/paypal-maintenance.ts`. Do not expose this command as an unauthenticated HTTP endpoint. The worker needs devDependency `tsx`; the standalone web runtime image does not include a worker entrypoint, so provision a separate worker image/job containing the source, tsx and Prisma client.
9. Monitor worker aggregate error counts, pending capture age, missing order IDs after uncertain create, webhook non-2xx rates, duplicate deliveries, exhausted/older-than-23h email jobs, mismatches and configuration changes. Review structured `AuditLog` transitions using restricted admin/DB access. Alert on any stuck state; never resolve it by blindly marking a registration confirmed. Twenty reconciliation items and twenty email jobs are processed per worker invocation; scale scheduling for traffic while respecting PayPal limits.
10. Rotate PayPal secrets through the secret manager, restart processes to clear OAuth cache, and preserve merchant/environment/order identity. Rotate webhook IDs only as part of a coordinated endpoint registration change. Changing merchant/environment with unresolved payments intentionally blocks their processing; drain/reconcile them in their original environment first.
11. Only after explicit production approval: configure the separate live app/webhook, set live environment and approval flag, then enable checkout. No automated process here switches to live mode or processes real payments.

Resend idempotency keys expire after 24 hours: https://resend.com/changelog/idempotency-keys . The worker stops ambiguous retries at 23h. Registration acknowledgements retain the existing best-effort email path; payment confirmation uses the durable outbox. This is not a tax-receipt generator; existing invoice creation remains a pre-payment invoice when requested.

## Validation and remaining launch risks

The implementation adds mocked unit/HTTP tests for verified success, decline/cancellation, money/currency/merchant/order/capture mismatches, ownership/IDOR, CSRF and mass assignment, forged/duplicate/stale webhooks, reversal evidence, duplicate/concurrent captures, lost responses, network/database failures and receipt delivery. Unit mocks do not prove PostgreSQL constraints or real provider/browser interoperability.

Run `npm run test:paypal`, `npm run typecheck`, `npm run lint`, `npx prisma validate`, `npm run build`, and `npm audit`. The opt-in real Sandbox create/idempotency integration test requires `PAYPAL_SANDBOX_INTEGRATION=true` and sandbox-only configuration. It creates a USD 1 test order without capturing; full buyer approval/capture and webhook/refund/reversal checks require the real SDK Sandbox walkthrough above. Never set this opt-in for production. PostgreSQL integration tests require an explicitly supplied `PAYPAL_TEST_DATABASE_URL` pointing to a local database whose name ends `_test`; they replay migrations only into a newly generated isolated schema and test real uniqueness, foreign keys, immutable fields and competing leases. They retain that isolated schema for inspection rather than resetting or deleting existing data.

Phase 2 payment verification: 117 payment/security tests passed and fifteen gated Sandbox/PostgreSQL tests skipped; root regressions had 197 passing tests and the same five existing reference-fidelity failures. Production build, TypeScript and Prisma validation passed. Existing lint errors remain. See the accompanying Phase 2 review for exact checks, the changed Vitest version, and integration limits.

The original audit found 23 advisories, including six production advisories. Phase 2 upgraded the affected production packages and compatible tooling, including Zod migration and a scoped Next/PostCSS override. The final installed-tree audit reports zero production advisories and six moderate development-only advisories in the TypeScript ESLint/Minimatch chain. Exact before/after versions and remaining advisory details are in the Phase 2 review. Do not interpret a clean production audit, successful build or unit tests as production security approval.

Other remaining risks: legacy shared admin identity and broader reviewer identity design; legacy evaluated reference scripts/CSP allowances; local settings/files across multiple replicas; existing public registration/challenge abuse controls outside checkout; inability to recover guest ownership automatically; uncertain create orders without a persisted provider ID require manual reconciliation using merchant dashboard and immutable invoice/payment/request references. No automatic new order, reference-based recovery, or provider-state fabrication is permitted.

## Rollback and incident response

Freeze new orders with `PAYPAL_ENABLED=false`. The safe default emergency policy also sets `PAYPAL_CAPTURE_ENABLED=false`, while keeping `PAYPAL_WEBHOOK_ENABLED=true` and `PAYPAL_RECONCILIATION_ENABLED=true`. To drain already approved orders, an authorized operator can explicitly retain capture=true; ownership, pending-registration, provider verification, lease and idempotency checks remain mandatory. Status can return stored state if reconciliation is separately paused. Webhook reconciliation uses its own operation context and is independent of the worker switch. Turning webhook processing off returns retryable failure and must be a deliberate, time-limited incident action. Environment changes require all relevant processes to reload/restart under the separate deployment approval procedure. For immediate freeze, the existing gateway can reject UUID checkout POSTs while allowing the separate webhook POST and status GETs; because create/capture share a route, this path-only rule stops both. Do not remove credentials, merchant IDs or environment binding while in-flight payments remain.

Keep payment/audit/webhook/outbox tables, order/capture IDs and enum values. Do not reverse financial migrations or delete provider references to roll back application code. Do not restore the old automatic admin login or unprotected settings handlers; use a secured rollback build or restrict access. Returning to an older registration writer must not re-enable unpaid confirmation. Reconcile PayPal records first after any database restore, before accepting another capture or resending receipts. Preserve webhook events and outbox identity across restoration; backups alone cannot establish provider truth. Refunds are a separately approved financial operation, not an automatic software rollback step.
