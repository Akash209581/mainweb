# PayPal Phase 2: security remediation and Sandbox readiness

**Phase 3 update (8 November 2026):** the approved dedicated-fresh-database runner now replays the unchanged public-qualified history only inside a newly provisioned Docker database/container/volume. All fourteen PostgreSQL tests passed, migration checksums/catalogs were verified, and read-only Prisma comparison found no difference. Use the current runner and prerequisites in the [Phase 3 validation report](paypal-phase-3-postgres-validation.md), not the older manual setup below. These Phase 2 results remain historical; Sandbox and production approval boundaries remain unchanged.

Review date: 7 November 2026. Target: the root Next.js App Router / PostgreSQL / Prisma application at `/ICGIT`. The separate website/admin projects were not upgraded or deployed.

## Outcome and approval boundary

Production dependency audit is clean in the installed root dependency tree. All 117 payment/security tests pass. Root regression results are 197 passed, five failed and fifteen skipped; the five failures are the same reference-fidelity mismatches from Phase 1. TypeScript, Prisma validation and production build pass. Lint retains existing errors. Six moderate development-only audit findings remain.

No database migration was executed, no existing registration/payment record was inspected or changed, no database was reset/dropped/truncated, no merchant configuration was changed, no secret was generated/rotated for a real environment, no PayPal API payment was made, and nothing was deployed. A local configuration-presence check printed booleans only: PayPal credential fields and the explicit test database URL are absent; Live request/approval and checkout/capture flags are not enabled. Build/test commands additionally used unreachable dummy test database URLs and disabled Live flags. The real Sandbox and PostgreSQL integration cases remain blocked, not successful.

This report is the end of the authorized phase. A separate approval is required before any production database access/migration, deployment, merchant configuration or Live activation.

## Source review and verified discrepancies

The review used the actual provider, service, verification, HTTP handlers, guest/CSRF guards, admin session/settings/upload handlers, Prisma schema, SQL migration, tests, package files and both prior documents.

| Finding | Evidence and correction |
| --- | --- |
| New-checkout shutdown also disabled webhooks and reconciliation | `paypalConfig` previously required PAYPAL_ENABLED=true for every provider operation. Split four switches, enforce operation-specific gates in both service and transport, and test independent modes. |
| Snapshot CHECK accepted a SQL unknown result | JSON keys containing JSON null pass key-existence checks but `->>` returns SQL NULL. PostgreSQL CHECK accepts unknown; require the entire condition to be IS TRUE. Add a gated real-database rejection test. |
| Invoice foreign keys did not guarantee relationship coherence | Independent registration/payment foreign keys allowed an invoice to reference another registration's payment or a different price. Add a PayPal-specific invoice relationship trigger and gated tests; leave non-PayPal invoice behavior unchanged. |
| Claimed immutable identity omitted Payment.id | Add primary-key immutability to the existing PayPal trigger. Test ID and snapshot/registration reassignment attempts in the gated database suite. |
| A stale request could clear a successor's lease | Release previously checked payment version rather than the lease it acquired. Release/persist now match the acquired operationUntil timestamp. First captureStartedAt is assigned only while null, preserving the retry deadline. Add a successor-lease timeout test and retry timestamp test. |
| Prisma schema omitted the SQL reconciliation index | Declare the existing SQL index in Prisma with its exact mapped name. Partial unique index, CHECK and triggers remain explicitly SQL-managed because this Prisma version does not model them equivalently. |
| Database test URL guard accepted arbitrary URL options | Restrict PostgreSQL protocols, loopback host, strict *_test database name and recognized parameters; reject a target matching application URLs; always generate a new schema and check nonexistence before migration. There is no DATABASE_URL fallback. |
| The original four database tests covered only part of the requested matrix | Expand to fourteen opt-in PostgreSQL tests, including cross-registration unique IDs, invoice linkage, null snapshots, real service state transactions, rollback and duplicate events. Actual execution remains blocked. |
| Receipt worker could describe a cancelled registration as confirmed | Require current CONFIRMED registration status before sending; defer and count ineligible jobs as errors. Filter worker payments/receipt jobs by configured merchant and environment. |
| Admin credential checks and settings changes lacked dedicated audit records | Add redacted login success/failure/logout and settings/document/photo audit events. A successful login does not issue a cookie if durable auditing fails. No password, token, secret or submitted settings content is logged. |
| Legacy generic upload parsed the whole multipart body before limits | Add a bounded 11 MiB read and shared request limit before multipart parsing; retain 10 MiB file/type/signature checks and CSRF/authorization. |
| Phase 1 dependency and shutdown descriptions became stale | Preserve the old report as a labelled baseline and update the operational runbook and this report with current behavior/results. |

PostgreSQL documents that CHECK accepts true or null: [constraint reference](https://www.postgresql.org/docs/current/ddl-constraints.html). None of the database corrections above has been represented as executed validation.

## Dependency remediation and compatibility

The initial audits reproduced 23 findings overall (3 critical, 9 high, 11 moderate) and six production findings (1 critical, 5 high). Targeted upgrades retained Next.js 15 and the application architecture. No `npm audit fix --force` was used.

| Package | Before | Installed after |
| --- | --- | --- |
| next | 15.5.20 | 15.5.29 |
| eslint-config-next | 15.5.20 | 15.5.29 |
| sharp | Root 0.35.3; Next nested 0.34.5 | 0.35.5, deduplicated |
| postcss | Root 8.5.16; Next nested 8.4.31 | 8.5.32, deduplicated |
| nanoid | 3.3.15 | 3.3.20 |
| source-map-js | 1.2.1 | 1.2.2 |
| zod | 3.25.76 | 4.6.7 |
| @hookform/resolvers | 3.10.0 | 5.9.2 |
| vitest | 2.1.9 | 4.1.12 |
| vite | 5.4.21 | 8.3.6 |
| @vitejs/plugin-react | 4.7.0 | 5.2.0 |
| tinypool | 1.1.1 | Removed from installed tree |

Next.js 15.5.29 still pins PostCSS 8.4.31. A scoped override of `next@15.5.29 -> postcss@8.5.32` fixes that runtime path without adopting Next.js 16. npm initially retained an invalid stale nested package despite the override: it was backed up inside scratch, only its stale visible/hidden lock entries were refreshed, and npm re-resolved it. `npm ls` now confirms the Next path resolves to 8.5.32 without an invalid dependency. The production build passed with this override. The next framework upgrade must explicitly review/retire that exact-version override.

The original vulnerable production paths were root -> next; root -> next -> postcss; root -> postcss; root -> next -> sharp and root -> sharp; postcss -> nanoid/source-map-js; root -> zod. The initial critical development paths included root -> vitest and root -> vitest -> tinypool. The old React test plugin retained Vite 5 after the first upgrade; updating the compatible plugin and explicitly pinning Vite removed that second vulnerable test-engine path. Compatible targeted updates also addressed brace-expansion, browserslist, js-yaml, baseline-browser-mapping and postcss-selector-parser. Exact installed path/version inventories follow below.

The Zod major upgrade was reviewed against its [official migration guide](https://zod.dev/v4/changelog). App changes replace `ZodError.errors` with `.issues` in both shared error formatting and environment validation and use the required two-argument record schema for settings. The form resolver was upgraded to a Zod-4-capable release; default/coercion/refinement and public form validation remain covered by regressions. No validation tests were weakened. Vitest alias configuration moved to supported top-level resolve.alias. The existing five fidelity test assertions and source fixtures were not rewritten.

Runtime resolution from Next was also checked directly: PostCSS 8.5.32 and Sharp 0.35.5. The full npm tree inventory lists two unreferenced optional artifacts as extraneous (`@emnapi/runtime` 1.11.3 and `@img/sharp-wasm32` 0.35.5); npm's prune dry-run reports up-to-date. This optional-platform inventory warning is separate from the six advisory entries. Validate a clean install in the intended deployment image before release.

Primary framework reference: [Next.js security update](https://nextjs.org/blog/nextjs-security-update-october-14-2026). Package versions were verified against registry metadata, the lockfile and the installed dependency tree, rather than inferred solely from this announcement.

### Remaining audit findings

Final `npm audit --omit=dev`: **0 advisories**. Final `npm audit`: **6 moderate, 0 high, 0 critical**. The remaining path is eslint-config-next -> @typescript-eslint/parser/eslint-plugin -> typescript-estree -> minimatch 10.2.6. The direct Minimatch advisory propagates to five TypeScript ESLint packages; these are six affected-package entries, not six independent vulnerabilities.

Advisory: [Minimatch globparts amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249), affected >=7.0.0 <11.0.1. The current typescript-estree release declares Minimatch ^10.2.2. A patched 11.x override crosses its declared major range; no unreviewed major override or toolchain downgrade was imposed. This development-only residual needs an upstream-compatible update or a separate validated lint-tooling migration. Do not expose developer/lint services to untrusted input or claim the complete dependency tree is clean.

## PostgreSQL validation: prepared, not executed

No PAYPAL_TEST_DATABASE_URL was supplied in the process or local configuration. No PostgreSQL server/schema/database/container was created or connected to in this phase. No existing PAYPAL rows or duplicates were queried. Consequently, a production migration is not recommended for approval on the basis of this report alone.

Fourteen gated tests are prepared for migration replay, concurrent lifetime-payment uniqueness, competing capture leases, immutable money/order/snapshot/primary-key/registration identity, duplicate webhook IDs, foreign keys, independent uniqueness of order/capture/create/capture-request IDs, invoice/registration/payment coherence, verified-state transaction confirmation/outbox, stale transition handling and transaction rollback. Their service transaction tests use a client explicitly bound to the isolated test schema; there is no application-client fallback. A randomized schema is preserved after the run for inspection.

Safety guard tests run without a database and reject missing URLs, non-PostgreSQL protocols, remote/unrecognized hosts, non-test database names, redirection/search-path connection options, application database matches and arbitrary schema names. These checks are safeguards, not proof that a loopback tunnel is non-production; the operator must provide the URL of the explicitly approved disposable server.

### Exact disposable setup procedure — operator run only

The following was **not executed**. Use an approved test machine and a new empty PostgreSQL instance. Never reuse an existing application database, container or data volume. The example binds to loopback only and gives Docker a new anonymous data volume. If a name or port is in use, choose another; do not stop/delete existing services to make room.

In PowerShell, obtain the disposable database password through a secure prompt and keep it out of command history/output:

```powershell
$testPassword = Read-Host 'Disposable PostgreSQL password' -AsSecureString
$testCredential = [System.Management.Automation.PSCredential]::new('paypal_test_user', $testPassword)
$testPasswordText = $testCredential.GetNetworkCredential().Password
$testEnvironmentFile = Join-Path (Get-Location) '.env.paypal-test.local'
if (Test-Path -LiteralPath $testEnvironmentFile) { throw 'Choose a new private env-file path; do not overwrite it.' }
Set-Content -LiteralPath $testEnvironmentFile -Value @(
  'POSTGRES_USER=paypal_test_user'
  'POSTGRES_DB=paypal_phase2_test'
  ('POSTGRES_PASSWORD=' + $testPasswordText)
)
$testContainerName = 'paypal-phase2-' + [guid]::NewGuid().ToString('N')
docker run --name $testContainerName --publish 127.0.0.1:55432:5432 --env-file $testEnvironmentFile --mount type=volume,target=/var/lib/postgresql/data -d postgres:16
$env:PAYPAL_TEST_DATABASE_URL = 'postgresql://paypal_test_user:' + [uri]::EscapeDataString($testPasswordText) + '@127.0.0.1:55432/paypal_phase2_test'
Remove-Variable testPasswordText
docker exec $testContainerName pg_isready -U paypal_test_user -d paypal_phase2_test
npm.cmd test -- test/paypal-postgres.integration.test.ts
```

Wait for the new server to be ready before the test command. Keep the private env file ACL-restricted and ignored by Git; prefer the test machine's secret manager where available. Do not print environment variables or run shell tracing. Do not run cleanup/reset commands: retain the new container, anonymous volume and schema for inspection. In that approved test instance only, inspect `pg_namespace` for names beginning `paypal_test_`; the test suite never drops them. Remove the test URL from the shell environment afterward without printing its value. Do not set DATABASE_URL to the production database to run these tests.

Before any later production proposal, obtain separate approval for a read-only inventory. `scripts/paypal-preflight.sql` is prepared but unexecuted: it returns only aggregate pre-migration PAYPAL row counts, duplicate registration/provider-reference groups and invoice mismatches. It uses existing columns, runs read-only, and contains no connection string. Any preexisting PAYPAL records require a reviewed data treatment plan, not deletion or invented backfills.

### Migration review

The existing unapplied migration now requires the snapshot condition to be IS TRUE, protects Payment.id, and adds the PayPal invoice coherence trigger. It still has no production-data update/reset. Enum additions precede transactional DDL; the CHECK is NOT VALID for preexisting rows, and custom partial uniqueness/trigger logic remains SQL-managed. A schema-to-schema Prisma diff was generated without connecting to a database; this is not SQL execution or replay validation.

Confirm actual migration history on an approved target before release. If someone applied an earlier copy outside this session, do not edit its checksum/history or rerun it blindly: prepare a separately reviewed follow-up migration for the corrections. This phase did not inspect production migration history.

## Sandbox readiness: blocked

No Sandbox client ID, secret, merchant ID, webhook ID or buyer session was supplied. No provider authentication/order/capture request was sent. The automatic USD 1 Sandbox create/idempotency test was skipped. Fourteen real PostgreSQL tests were skipped for the separate database reason above.

Prepare a separate test application deployment/database after approval. Set PAYPAL_ENV=sandbox; securely provide the sandbox app's client ID/secret, merchant ID and its own webhook ID. Use an international Sandbox buyer. Configure the isolated app's exact HTTPS PUBLIC_APP_ORIGIN and register `https://<approved-test-origin>/ICGIT/hanvo/paypal/webhook` on the Sandbox REST app. Never point a tunnel/callback at the production application. Do not copy production registrations into the test database. Create reviewed test conference/pricing fixtures, including the expected icgit-2026 slug, in a separate approved test schema; migration replay alone does not create those fixtures. Keep sample totals small, e.g. USD 1.

Initially keep order/capture flags false; webhook/reconciliation flags true. After the isolated environment/fixtures are approved, explicitly enable order and capture flags for the walkthrough. For the automatic provider-only test, set PAYPAL_SANDBOX_INTEGRATION=true in the Sandbox-only test process and run `npm run test:paypal`. It checks the environment before provider calls. Do not enable that opt-in in production.

All of the following real-environment checks remain **not executed / blocked**:

1. OAuth authentication with the real Sandbox REST app.
2. Real order creation and public SDK loading under the site's CSP.
3. Sandbox buyer approval and successful capture.
4. Atomic registration confirmation after independently fetched capture.
5. Decline, buyer cancellation and browser closure.
6. Duplicate capture and lost provider response recovery.
7. Real duplicate webhook delivery and forged-signature rejection.
8. Real refund and reversal event/resource shapes and reconciliation.
9. Worker interruption/recovery and real receipt delivery/retry.

These group the requested seventeen checks; mocked tests cover their relevant code paths but are not substitutes for this walkthrough. Receipt testing requires an approved test email account/provider configuration too. No successful integration result has been fabricated.

## Admin security review and rotation procedure

Automatic admin cookie issuance and the predictable fallback secret remain removed. Login verifies the configured scrypt hash, uses bounded JSON, exact Origin and cookie-bound CSRF, and enforces the shared database login bucket. Login/logout cookies are HttpOnly, SameSite=Strict, path-scoped to /ICGIT, and Secure in production. Logout expires both current and legacy root cookie paths. Settings and uploads retain authorization/CSRF checks, bounded input and filename/path restrictions. Credential outcomes and settings/document/photo mutations now record redacted audit events. Rotation rejection is tested with in-memory test keys; no real signing key was generated or printed.

Operational rotation, after separate deployment/configuration approval:

1. Identify every app instance and worker that consumes ADMIN_SESSION_SECRET. Restrict administrative traffic during the coordinated change.
2. Generate a new high-entropy secret using the organization's secret manager/private operator workflow. Do not paste it into chat, terminal output, command-line arguments, source control or reports.
3. Update all instances atomically; restart/reload all affected processes, then retire the old value. Mixed instances with old keys still accept old sessions, so rotation is incomplete until all are replaced. Do not configure fallback/multiple-key acceptance for the old auto-issued cookies.
4. Verify an old session is rejected, valid credentials create a new session, and mutations reject a missing/invalid CSRF token. Use secure operator tooling without logging cookies.
5. Review redacted authentication audit events, rotate the admin password/hash if warranted, and keep SUBMISSION_CHALLENGE_SECRET independently managed. Do not expose hashes or credentials during verification.

Residuals: the application still maps the authenticated admin to a shared local admin identity; individual staff attribution/reviewer identity needs its own design. The global login bucket intentionally favors brute-force resistance but can lock out the single configured account during attack. Stateless logout does not revoke a stolen copy of a token; signing-secret rotation invalidates all copies. File signatures are not malware scanning or full OOXML validation. Local settings/files and PostgreSQL cannot commit atomically across multiple replicas; partial settings/audit/file failures still need operational reconciliation. Legacy unsafe-eval reference rendering/CSP and broader app logging/public-form controls remain documented risks.

## Emergency shutdown policy

| Operation | Switch | Default | Enforcement |
| --- | --- | --- | --- |
| New order creation | PAYPAL_ENABLED | false | Service entry and exact POST Orders transport gate |
| Existing order capture | PAYPAL_CAPTURE_ENABLED | false | Service entry and exact POST capture transport gate |
| Verified webhook processing | PAYPAL_WEBHOOK_ENABLED | true | Signature/event/read context; does not consult new-order/capture switches |
| Scheduled reconciliation and receipts | PAYPAL_RECONCILIATION_ENABLED | true | Worker gate and read-only reconciliation context |

Recommended freeze: new orders=false, capture=false, webhook=true, reconciliation=true. Drain policy: new orders=false, capture=true only by an authorized operator, with webhook/reconciliation true. Drain does not auto-capture: the existing ownership-bound capture endpoint still requires a pending eligible registration, APPROVED provider order, verified international payer, exact binding/price/merchant, a lease and the original idempotency key. The worker and webhooks never initiate a capture.

Transport classification does not allow a caller's read context to relabel create/capture requests. Webhook reads continue when scheduled reconciliation is separately paused. If reconciliation is paused, participant status reads return stored state without provider calls; no new confirmation is inferred. Explicitly pausing webhooks yields retryable non-2xx responses and must be time-limited because PayPal's delivery retries are finite. Credentials, merchant/environment bindings and Live approval checks remain mandatory for every permitted operation; these flags are not a provider-verification bypass.

Environment switches take effect when every relevant process receives/reloads the setting; they are not a hot remote feature-flag service. For an immediate freeze during propagation, an operator can reject POST requests to `/ICGIT/hanvo/paypal/<registration UUID>` while permitting POST `/ICGIT/hanvo/paypal/webhook` and status GETs. Create and capture share the UUID route: a path-only rule freezes both; create-only gateway blocking would need an explicitly reviewed JSON-action-aware rule. Use the application switches for the drain policy. No gateway or process was reconfigured here.

## Guest checkout recovery recommendation — not implemented

Do not recover ownership from a registration reference, an unverified email assertion, screenshot, payer callback or public status endpoint. The current cookie binding remains unchanged.

Proposed support-assisted design for separate review:

1. An individually authenticated, appropriately authorized support operator verifies the participant through the existing stored email channel plus nonpublic conference/payment evidence checked in merchant records. Do not disclose registration existence to unauthenticated requesters. Resolve the shared-admin attribution limitation before enabling this workflow.
2. Create a cryptographically random recovery capability, store only its hash with the registration/ownership version, expiry of approximately fifteen minutes, issuing operator ID, purpose and unused state. Deliver only to the original verified contact channel, not a newly supplied address. No token/reference values appear in logs or analytics.
3. Apply global/per-account/per-capability limits and generic responses/timing to prevent enumeration; require CSRF/Origin for the final POST. A GET or email scanner must not consume the token. Use a no-referrer recovery page without third-party content, exchanging the capability from a URL fragment rather than leaking it in request logs.
4. Freeze further capture for the affected registration, wait for active operations to settle, and reconcile provider truth first. Consume the token with a conditional unused/unexpired update and reassign the guest hash/ownership version in one transaction. Version checks must invalidate old ownership contexts; never clear provider IDs, price snapshots, idempotency keys or verified financial state.
5. Issue a fresh restricted HttpOnly cookie, invalidate the old binding, audit the issuing/consuming operator, internal entity IDs and outcome without raw tokens, and notify the original participant channel. Handle competing recovery requests and partial failures fail-closed.

This requires support identity, verified-email policy, recovery storage and ownership-version behavior that do not exist today. Implementing it now would unexpectedly change participant workflows. No insecure shortcut or new public recovery endpoint was added.

## Final checks and comparison

| Check | Phase 1 | Phase 2 |
| --- | --- | --- |
| Payment/security tests | 88 passed; 5 skipped | 117 passed; 15 skipped |
| Root suite (`npm test -- --dir test`) | 168 passed; 5 failed; 5 skipped | 197 passed; 5 failed; 15 skipped; 217 total |
| TypeScript | Passed | Passed |
| Prisma schema validation | Passed | Passed |
| Production build | Passed | Passed on Next 15.5.29 with scoped PostCSS override |
| Lint | Existing errors | Same existing error categories; not disabled to obtain success |
| Overall audit | 23: 3 critical, 9 high, 11 moderate | 6 moderate; no high/critical |
| Production audit | 6: 1 critical, 5 high | 0 |
| PostgreSQL migration replay | Not executed | Not executed: no approved disposable URL |
| Real Sandbox API/SDK/payment flow | Not executed | Not executed: credentials/buyer/test environment unavailable |

The five old failures compare registration HTML, abstract HTML, brochure, sessions and committee against different branded reference originals. They remain unchanged. No new test regressions were observed. Existing lint includes explicit-any, prefer-const, reference ts-nocheck and anchor rules. Vitest emits a non-failing native-config-loader/CommonJS warning; its output was not suppressed. The project already skips lint during build, so a build pass is not a lint pass.

## Remaining blockers and deployment prerequisites

- Obtain an explicitly approved disposable PostgreSQL URL and execute/review all fourteen database tests plus migration replay. Approve any read-only production inventory separately; inspect existing PAYPAL rows/duplicates before proposing a production migration.
- Supply Sandbox-only credentials, buyer, isolated HTTPS callback, reviewed test fixtures and test email configuration; complete all real-provider/SDK/recovery checks above.
- Review the revised migration and verify its actual history/checksum status before any application deployment. Apply only under a separate approval after backup/restore validation; new code requires the new schema even when new checkout is off.
- Resolve or explicitly accept the six development-only advisories and existing lint/reference failures through the appropriate review. No assertion of complete application security is made.
- Coordinate admin signing-secret rotation, individually attributable staff access, actual merchant eligibility, price/tax/refund/accommodation policy approval, TLS/proxy controls, least-privilege database credentials, pool sizing, persistent files/settings, verified sender and worker monitoring.
- Review the precise dependency pins/override and ship package.json/package-lock.json as a pair. The Node 22.19.0 environment used here meets the patched tooling's requirements; validate the deployment image independently.

## Rollback and recovery

Before release, retain the reviewed secured application artifact and exact dependency lockfile. Do not use an older artifact that restores automatic admin login, unprotected settings, unpaid confirmation or known-vulnerable production dependencies. A rollback build must retain these fixes or administrative/payment traffic must stay isolated.

For an incident, freeze new orders and choose capture freeze/drain explicitly, while preserving verified webhook processing and reconciliation. Do not disable/remove credentials merely to stop new checkout. Keep merchant/environment, financial snapshots, order/capture/request references, webhook IDs and receipt identities intact. Reconcile all in-flight outcomes before any capture retry or receipt resend. Do not roll back/delete financial tables or invent refunded/paid states to make software rollback convenient.

No database migration has been executed in this phase, so there is no database rollback to perform. If a later migration fails, enum additions may have committed before the transactional DDL: inspect the approved environment and Prisma migration history, use a reviewed forward repair, and never reset/drop a database or edit applied checksums. After any restore, compare authoritative provider orders/captures/events and outbox sends before accepting traffic. Rotation rollback must never reinstate the old auto-issued-session key.

## Exact dependency path/version inventory

The following inventory compares the original lockfile/audit nodes to the final lockfile and installed-tree checks. Removed paths mean the vulnerable package copy was removed/deduplicated, not that its name was merely hidden from the audit.

| Package | Before installed paths/versions | After installed paths/versions |
| --- | --- | --- |
| @typescript-eslint/eslint-plugin | node_modules/@typescript-eslint/eslint-plugin @ 8.62.1 | node_modules/@typescript-eslint/eslint-plugin @ 8.72.1 |
| @typescript-eslint/parser | node_modules/@typescript-eslint/parser @ 8.62.1 | node_modules/@typescript-eslint/parser @ 8.72.1 |
| @typescript-eslint/type-utils | node_modules/@typescript-eslint/type-utils @ 8.62.1 | node_modules/@typescript-eslint/type-utils @ 8.72.1 |
| @typescript-eslint/typescript-estree | node_modules/@typescript-eslint/typescript-estree @ 8.62.1 | node_modules/@typescript-eslint/typescript-estree @ 8.72.1 |
| @typescript-eslint/utils | node_modules/@typescript-eslint/utils @ 8.62.1 | node_modules/@typescript-eslint/utils @ 8.72.1 |
| @vitest/mocker | node_modules/@vitest/mocker @ 2.1.9 | node_modules/vitest/node_modules/@vitest/mocker @ 4.1.12 |
| baseline-browser-mapping | node_modules/baseline-browser-mapping @ 2.10.41 | node_modules/baseline-browser-mapping @ 2.11.35 |
| brace-expansion | node_modules/@typescript-eslint/typescript-estree/node_modules/brace-expansion @ 5.0.7<br>node_modules/brace-expansion @ 1.1.15 | node_modules/@typescript-eslint/typescript-estree/node_modules/brace-expansion @ 5.0.12<br>node_modules/brace-expansion @ 1.1.21 |
| browserslist | node_modules/browserslist @ 4.28.4 | node_modules/browserslist @ 4.29.5 |
| esbuild | node_modules/esbuild @ 0.28.1<br>node_modules/vite/node_modules/esbuild @ 0.21.5 | node_modules/esbuild @ 0.28.1 |
| js-yaml | node_modules/js-yaml @ 4.3.0 | node_modules/js-yaml @ 4.3.2 |
| minimatch | node_modules/@typescript-eslint/typescript-estree/node_modules/minimatch @ 10.2.5<br>node_modules/minimatch @ 3.1.5 | node_modules/@typescript-eslint/typescript-estree/node_modules/minimatch @ 10.2.6<br>node_modules/minimatch @ 3.1.5 |
| nanoid | node_modules/nanoid @ 3.3.15 | node_modules/nanoid @ 3.3.20 |
| next | node_modules/next @ 15.5.20 | node_modules/next @ 15.5.29 |
| postcss | node_modules/next/node_modules/postcss @ 8.4.31<br>node_modules/postcss @ 8.5.16 | node_modules/postcss @ 8.5.32 |
| postcss-selector-parser | node_modules/postcss-selector-parser @ 6.1.4 | node_modules/postcss-selector-parser @ 6.1.5 |
| sharp | node_modules/next/node_modules/sharp @ 0.34.5<br>node_modules/sharp @ 0.35.3 | node_modules/sharp @ 0.35.5 |
| source-map-js | node_modules/source-map-js @ 1.2.1 | node_modules/source-map-js @ 1.2.2 |
| tinypool | node_modules/tinypool @ 1.1.1 | Removed/deduplicated |
| vite | node_modules/vite @ 5.4.21 | node_modules/vite @ 8.3.6 |
| vite-node | node_modules/vite-node @ 2.1.9 | Removed/deduplicated |
| vitest | node_modules/vitest @ 2.1.9 | node_modules/vitest @ 4.1.12 |
| zod | node_modules/zod @ 3.25.76 | node_modules/zod @ 4.6.7 |
| @hookform/resolvers | node_modules/@hookform/resolvers @ 3.10.0 | node_modules/@hookform/resolvers @ 5.9.2 |
| @vitejs/plugin-react | node_modules/@vitejs/plugin-react @ 4.7.0 | node_modules/@vitejs/plugin-react @ 5.2.0 |
| eslint-config-next | node_modules/eslint-config-next @ 15.5.20 | node_modules/eslint-config-next @ 15.5.29 |
