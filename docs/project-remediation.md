# Project remediation — 19 November 2026

This pass fixes confirmed correctness, privacy, persistence and verification issues in the current working tree. Existing staged and unstaged application/payment work was preserved. No deployment, production database connection, migration execution, merchant change or real payment request was performed.

## Implemented

- Client authentication reflects the server session instead of always claiming a signed-in administrator. Profile loading now checks administrator authentication before accessing the profile.
- Notification streams derive ownership from the authenticated session, ignore caller-supplied user identifiers, prevent overlapping database polls, and release timers/listeners when aborted or cancelled.
- General Resend delivery checks returned provider errors. Public health responses no longer expose underlying database exception messages.
- Generic document storage checks extension, declared MIME type and document signatures/structure before writing, and rejects empty files.
- Public database listings and conference selection use `PUBLIC_CONFERENCE_SLUG`. Authenticated abstract creation no longer silently substitutes another conference when the requested one is missing/deleted.
- Rate-limit maps have capacity limits and expire old entries when capacity is reached. This remains process-local limiting and requires a trusted reverse proxy for forwarded client addresses.
- Removed global copy/selection/context-menu blocking from the layout.
- Event structured data uses configured database dates/mode. Removed the inherited root canonical that could incorrectly canonicalize child pages to the homepage. Added sessions to the sitemap, removed its artificial fixed modification date, and excluded private/application endpoints from crawler rules.
- Content-version failures return an unavailable status instead of inventing increasing versions that repeatedly refresh clients during database outages.
- Compose mounts `storage/`; the image prepares writable runtime directories. Docker context excludes nested credentials, dependencies and runtime data.
- Both SQLite adapters expose connection cleanup. Their tests close database connections, reopen to check persistence, and release resources even when assertions fail.
- CI explicitly generates Prisma and runs root regression tests plus both standalone portal core suites, with unreachable dummy database URLs and payment integrations disabled.
- Resolved lint errors with concrete types and a narrow exception for the three imported design files. Existing lint warnings remain.
- Reference fidelity checks now compare against explicit ICGIT integration adaptations. The importer applies those same exact-match adaptations so regeneration retains branding, signed brochure challenges and payment-method handoff. Comparisons still cover the complete resulting markup, scripts, JSX and styles.
- Added isolated production build output through `NEXT_BUILD_DIR` to avoid sharing generated output with an existing development server.

## Verification

| Check | Result |
| --- | --- |
| Root regression suite | 244 passed, zero failed, 15 intentionally skipped |
| Both standalone portal core suites | Four passed, zero failed |
| TypeScript | Passed; production build also passed type validation |
| Lint | Passed with existing warnings |
| Production build | Passed using `NEXT_BUILD_DIR=.next-build` |
| Diff whitespace validation | Passed |

The 15 skipped tests are the 14 separately gated PostgreSQL tests and one separately gated real PayPal Sandbox test. Neither integration milestone was rerun here. Ordinary verification used unreachable dummy PostgreSQL URLs and disabled payment/integration switches.

The initial shared `.next` build compiled, typechecked and generated pages but failed during output tracing because a generated trace was missing. The isolated `.next-build` retry completed successfully. Existing Node processes were left running. Next.js added the isolated generated-types directory to `tsconfig.json`.

Local ignored verification evidence: `scratch/project-fixes-final-tests.json`, `scratch/project-fixes-final-tests.log`, `scratch/project-fixes-lint.log`, and `scratch/project-fixes-isolated-build.log`.

## Remaining work and operating limits

This is not a declaration that every architectural concern is resolved. Independent author/reviewer identity, replacing the legacy shared internal administrator account, PostgreSQL/JSON settings consolidation, stronger CSP after removing imported script execution, cross-replica caching/rate limiting, durable retries for all non-payment emails, and browser accessibility/performance validation remain.

Stripe and provider refund initiation are not implemented. Real PayPal Sandbox validation and live activation remain separate milestones. An operator must configure the payment maintenance scheduler and monitor retries/outbox failures; this pass does not enable it or initiate provider traffic.

The root application and SQLite packages remain separate deployment alternatives. No application or data directory was deleted or merged. See the root README for deployment roles, storage mounts, Linux ownership requirements, test commands and maintenance scheduling.
