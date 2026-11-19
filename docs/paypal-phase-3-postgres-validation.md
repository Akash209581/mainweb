# PayPal Phase 3 — isolated PostgreSQL validation

Review date: 8 November 2026. Scope: the root `/ICGIT` application, dedicated disposable PostgreSQL testing only. **The PostgreSQL validation milestone passed: all 14 real database tests passed, with zero skipped.** PayPal Sandbox testing has not begun.

## A. Authorization, preflight and Docker verification

The user explicitly approved dedicated-fresh-database replay in a new Docker container and volume, followed by migration validation and all fourteen PostgreSQL tests. Production/staging access, existing-service changes, deployment, real PayPal requests, merchant changes and Live activation remained excluded.

The earlier attempts stopped because Docker's daemon was unavailable. On this resume, Docker Desktop 4.56.0 responded with Linux Engine 29.1.3. The PostgreSQL 16 image was already available; no pull was necessary. Its immutable image ID/digest was `sha256:4b7183ac05f8ef417db21fd72d71047a4238340c261d3cc3ddb6d579ab5071ae`. The actual new server reported PostgreSQL **16.14**, `server_version_num=160014`.

Read-only inventory found existing containers, including PostgreSQL containers, and running native PostgreSQL 16/18 services. They were not reused, stopped, restarted or reconfigured. Docker was already operational; this work did not start its service. Docker allocated a free host port atomically for each new container using `127.0.0.1::5432`; no existing port or service had to be displaced. Inspection verified exactly one published binding, on IPv4 loopback, without an IPv6 or wildcard host binding.

Source review covered the prior Phase 2/3 reports, both existing isolation helpers, the complete integration runner, Prisma schema/configuration, and all five historical migrations. The initial migration explicitly targets `public`, so random-schema replay remains unsuitable. No migration was edited to work around that history.

## B. Dedicated database isolation and target verification

`test/helpers/paypal-fresh-database.ts` creates a new random container, labeled named volume, database ending `_test`, bootstrap identity and separate restricted login on every opted-in invocation. No resource is reused. The runner accepts **no caller database URL** and has no application-URL fallback. `PAYPAL_TEST_DOCKER=true` is mandatory; any supplied `PAYPAL_TEST_DATABASE_URL` is rejected, including one discovered in local configuration.

Before migration deployment, the runner verifies:

1. Docker server availability and the local image's immutable ID.
2. Existing container/volume inventory, a newly generated volume name, and its run label/creation metadata.
3. The full new container ID, absence from the prior inventory, matching image/run label and the exact mounted volume.
4. Exactly one loopback host binding and the assigned port. Docker's successful allocation establishes that the selected port was available.
5. TCP readiness of the final server and actual PostgreSQL major version 16.
6. Actual database name, authenticated role and server version through a Prisma client with an explicit datasource.
7. Restricted role flags: no superuser, database creation, role creation, replication or RLS bypass. It owns only the new test database/schema needed for migration DDL.
8. No pre-existing application relations or unexpected application namespaces.
9. Comparison with protected `DATABASE_URL` and `DIRECT_URL` loaded from the process/local `.env`, without connecting to either. Loopback aliases normalize to the same target identity; malformed protected URLs fail closed.
10. The container is still running with the expected immutable image immediately before returning the verified target. The migration child receives only that generated URL in both datasource variables.

Passwords use cryptographic random bytes. Bootstrap credentials pass through a child environment, and restricted-role provisioning passes through stdin; passwords/full URLs are not printed or placed in command-line arguments. Docker inspection output is captured privately because it includes bootstrap environment credentials. Nonsecret verification evidence is retained in ignored `scratch/` JSON files. The retained container remains inspectable through its bootstrap local socket without printing credentials; no reconnect password was added to source or this report.

All historical SQL executes in `public` **inside the newly created test database**. PostgreSQL migrations use the restricted role, not the bootstrap superuser. The source preflight rejects server-level database/role/server/tablespace and cross-server extension features. This is a repository-specific check, not a general SQL security parser. The older random-schema rejection helper remains as a regression guard; it is not used to force this replay into a random schema.

### Preserved resources and attempts

| Attempt | Container | Host port | Outcome |
| --- | --- | --- | --- |
| 1 | `paypal-phase3-3cca10bd89189f8fcf5dcd8245b82bc9` | 54243 | Startup probe reached temporary initialization server; setup failed before migration and all 14 tests were skipped. Preserved. |
| 2 | `paypal-phase3-400748e3ee470cf6e48922102d8622a5` | 61973 | Corrected TCP readiness; full replay/catalog checks and all 14 tests passed. Preserved. |
| 3, final | `paypal-phase3-f796d02c3ecd2ac941865c43c0647af8` | 58525 | Added full read-only Prisma schema comparison; replay/catalog comparison and all 14 tests passed. Preserved. |

Each attempt has its own correspondingly named `-data` volume and fresh database; none was reset or reused. The initialization race was corrected by probing TCP instead of the Unix socket: the image's temporary initialization server accepts local sockets before it shuts down to start the final server. No assertion or isolation check was weakened.

Final inspection target:

- Container ID: `3857ab1492c16299db76a13bbeb4334087bd2a2beded0d32cc6fc47f4f83685f`.
- Database: `paypal_f796d02c3ecd2ac941865c43c0647af8_test`.
- Restricted role: `paypal_f796d02c3ecd2ac941865c43c0647af8`.
- Volume: `paypal-phase3-f796d02c3ecd2ac941865c43c0647af8-data`, created `2026-11-08T18:01:57Z`.
- Published endpoint: `127.0.0.1:58525`, PostgreSQL 16.14.
- Cluster database inventory: the fresh `_test` database plus newly initialized `postgres`, `template0` and `template1`; no application database was attached/copied.
- Retained fixtures after the final suite: 14 conferences, 19 registrations, 13 payments, two webhook records and two outbox records. Negative/rollback tests intentionally leave fewer successful payment inserts.

No container, volume, database, schema or fixture was deleted. No prune/reset/truncate/cleanup command was run. All three containers were still running at final inspection. One manual read-only fixture query initially lost quoted identifiers through PowerShell native argument handling; it failed without mutation and was repeated successfully using stdin.

## C. Complete migration replay and catalog validation

The runner executes `prisma migrate deploy` only after the above checks, using the explicit fresh datasource in its child environment. It replays **all five migrations in order**, with no baseline skipping or history repair. Migration history confirmed each completed successfully, no rolled-back entry, and checksum equality with the source inventory.

| Migration | Preserved SHA-256 |
| --- | --- |
| 20260703000100_initial_enterprise_schema | dab40ecc318106c7e00d277c3261f3f58075a0861634672e55314aa1cb19d9fe |
| 20261105000100_registration_details | 44391035a85dc6797d6439dc62808d552dc977525eeac6ce2602ac394425839b |
| 20261105000200_registration_phone | 2546ab9a4adbffba53700dfca05f63720d2d40e1ed73bb76a88ea07d1ca522c4 |
| 20261105000400_public_abstract_submissions | 344e17a80f7ad4bba36193f2c4454131b8731ba5d498bba9195527dbe9efe8ba |
| 20261107000100_paypal_checkout | 28040a0d597eda2d5338f56ab2ecdc4032707687fbc5d9069a5454f32696cbd2 |

`test/helpers/paypal-replay-catalog.ts` checks history and the complete historical named table, enum, index and constraint inventory, enum values/order, enabled custom triggers, function definitions and application namespaces before and after the tests. The final catalog contains **42 tables including `_prisma_migrations`, 11 enums, 162 indexes, 56 foreign keys and two custom triggers**. There were no unexpected application namespaces outside `public`.

A separate **read-only** `prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code`, with both child datasource variables explicitly bound to the fresh database, exited zero: no difference for Prisma-modeled objects. It does not execute the generated changes or replace checks of SQL-managed objects.

Verified SQL-managed behavior:

- `Payment_one_paypal_registration` exists as a partial unique index, and concurrent inserts permit exactly one lifetime PayPal payment.
- Unique order/capture/create-request/capture-request indexes reject cross-registration duplicates.
- `Payment_paypal_snapshot_required` exists with the enclosing `IS TRUE` condition. Its intentional `NOT VALID` status remains; newly inserted invalid/JSON-null snapshots are rejected. No production legacy-row validation is implied.
- `Payment_protect_paypal_identity` is enabled and its function protects primary key, registration, financial snapshot and provider identity. Real update attempts are rejected.
- `Invoice_protect_paypal_relation` is enabled; real registration/amount/currency mismatch inserts are rejected and a matching invoice succeeds.
- `Payment_paypal_reconciliation` exists on provider and last reconciliation time.
- Foreign keys, webhook uniqueness, transaction confirmation/outbox creation, stale-transition handling and rollback execute successfully against the real database.

No historical migration, applied checksum or Prisma history was edited.

## D. All fourteen PostgreSQL integration tests

Final command: `npm.cmd test -- test/paypal-postgres.integration.test.ts`, with process-only `PAYPAL_TEST_DOCKER=true`, Sandbox opt-in false, checkout/capture false and Live approval false. The file also replaces `fetch` with a throwing guard during the database tests so provider requests cannot occur. No caller URL is supplied.

**Final result: 14 passed, 0 failed, 0 skipped.** The complete suite was rerun after the readiness correction and again after adding the schema comparison. The initial setup failure is retained above; it is not counted as a successful database run.

| # | Test | Final result |
| --- | --- | --- |
| 1 | enforces one PayPal payment for concurrent creates | Passed |
| 2 | permits only one concurrent processing lease, including expiry/retry | Passed |
| 3 | enforces immutable price/order identity | Passed |
| 4 | enforces event uniqueness and payment foreign keys | Passed |
| 5 | enforces unique paypalOrderId across registrations | Passed |
| 6 | enforces unique paypalCaptureId across registrations | Passed |
| 7 | enforces unique createRequestId across registrations | Passed |
| 8 | enforces unique captureRequestId across registrations | Passed |
| 9 | rejects nonexistent registration foreign keys | Passed |
| 10 | rejects invoice/payment registration and money mismatches | Passed |
| 11 | rejects JSON-null price snapshots and immutable identity changes | Passed |
| 12 | commits paid registration/outbox and deduplicates events atomically | Passed |
| 13 | rejects stale transitions and does not regress a verified paid state | Passed |
| 14 | rolls back payment and event writes when confirmation is impossible | Passed |

These tests exercise the real service transaction implementation with an explicitly bound test Prisma client. Mocked HTTP/provider tests are not substituted for PostgreSQL execution. No tests or reference fixtures were weakened.

## E. Regression results

Ordinary regressions/build checks used unreachable dummy application datasource values (`127.0.0.1:1`, database ending `_test`), Docker integration opt-in false, Sandbox opt-in false, checkout/capture false and Live approval false. They do not connect to normal application databases.

| Check | Resumed result |
| --- | --- |
| Dedicated real PostgreSQL suite | 14 passed; zero failed/skipped |
| Root suite, `npm.cmd test -- --dir test` | 203 passed, five failed, 15 skipped; 223 total |
| TypeScript, `npm.cmd run typecheck -- --incremental false` | Passed |
| Prisma schema validation | Passed |
| Production build | Passed on Next.js 15.5.29; no deployment |
| Lint / npm audit | Not rerun in this resume; Phase 2 findings remain historical |

The five root failures remain the same approved-reference fidelity comparisons: registration/index HTML, abstract HTML, brochure, sessions and committee. Fifteen ordinary-suite skips comprise the fourteen intentionally gated database tests plus one real Sandbox test; the separate opted-in run above executed and passed all fourteen database tests. The root JSON evidence is `scratch/phase3-resumed-regression.json`. Existing Vite native-loader/CommonJS and JSDOM scrollTo warnings were not suppressed. Build skips lint by existing project configuration, so build success is not lint success.

## F. Files changed in this resume

- `test/helpers/paypal-fresh-database.ts`: fresh-resource provisioning, restricted role, version/container/image/volume/loopback/empty-target/protected-URL verification and nonsecret evidence.
- `test/helpers/paypal-replay-catalog.ts`: complete migration history/catalog inventory, enum values and SQL-managed guard verification.
- `test/paypal-postgres.integration.test.ts`: replace unsafe random-schema replay with verified fresh-database replay; add read-only Prisma comparison, provider network guard and post-test catalog verification. Preserve the fourteen test assertions.
- `docs/paypal-phase-3-postgres-validation.md`: replace blocked-only status with actual replay, attempts, isolation, test and preservation evidence.
- `docs/paypal-phase-2-review.md`: update the Phase 3 status pointer while preserving the historical Phase 2 results.

The build also refreshed the generated TypeScript incremental cache (`tsconfig.tsbuildinfo`), which already had staged/unstaged changes. Existing repository work was not reverted.

No application business logic, dependency versions or migration source was changed in this resume. Earlier repository changes remain in place.

Nonsecret local evidence files include `scratch/paypal-phase3-f796d02c3ecd2ac941865c43c0647af8-evidence.json` and the corresponding `-catalog.json`; the earlier successful run has its own evidence/catalog files. These scratch artifacts are ignored by Git. This report records the durable review details without credentials.

## G. Remaining boundaries and next milestone

The isolated PostgreSQL milestone is complete. Existing lint/reference failures, development dependency advisories and deployment/merchant/admin operational prerequisites from Phase 2 remain separate work. Successful replay in an empty PostgreSQL 16.14 database does not validate production data, applied production migration history, duplicate legacy rows, backup/restore readiness or deployment readiness.

**No production or staging database was accessed, no production migration was performed, no existing service/database/container was modified, no real PayPal request/payment was made, no merchant credentials were changed, nothing was deployed and PayPal Live was not activated.** New test-only databases, roles and records were created only inside the newly provisioned disposable containers.

Stop here. PayPal Sandbox testing requires separate approval and its own approved environment/credentials. No Sandbox work has started.
