# Public validation, persistence and admin login

The admin login now follows the established reference theme: light background, white card, navy branding/buttons, restrained gold eyebrow, labelled fields, masked password, focus states, loading state and visible authentication errors. Existing credentials and signed-session behavior are retained.

## Public form validation

Client input guards run on ordinary pages and inside the approved reference Shadow DOM. Phone controls block letters and retain international phone formatting. Whole-number controls block letters, signs and exponent notation. Names receive matching browser validity messages. The server validates independently, including direct/tampered requests.

| Input | Server rule |
| --- | --- |
| Names | Required where displayed; bounded length; Unicode letters/marks, spaces, apostrophes, periods and hyphens; no digits or hidden line breaks |
| Phone | 7–15 digits, optional leading `+`, spaces/parentheses/hyphens; no letters; optional only where the form makes it optional |
| Email | Trimmed, valid email syntax, bounded length |
| Country | Known displayed country/region names and supported aliases; UUID-based selections must reference existing database records |
| Category, currency, role, presentation, room, guests, bed preference, query subject and brochure interest | Supported values only |
| Rooms / representatives | Whole-number counts in the configured form ranges; scientific notation, negatives and fractions rejected |
| Accommodation | Real calendar dates, check-out after check-in, at most 365 nights; single rooms allow one guest per room |
| Billing | Organisation and address required when invoice is selected |
| Partnerships | Valid selected package and representative count required |
| Declarations | Registration terms, abstract author/ethics/terms declarations, and brochure/query privacy acknowledgement required |
| Co-authors | Bounded list with validated names and affiliations |
| Files | Actual File required; allowed PDF/DOC/DOCX extension and signature; DOCX Word-package markers; configured backend size limit, capped at 10 MB |
| Totals | Computed from saved server prices, rounded to integer cents; client totals ignored; out-of-range totals rejected |

The same rules cover the retained React forms. Public inquiries share the server schema. Profile names, organisation, country, phone and biography now reach storage; optional profile fields can be cleared. Missing profile/country records fail rather than returning false success.

## Verification challenge and responses

Registration, abstract and brochure challenges are issued by `/ICGIT/api/challenge` and signed on the server. Tokens expire after 30 minutes. Wrong answers, tampering, expiry and reuse after success are rejected. A failed save releases its in-process reservation so the user can correct input/retry. Tokens are excluded from stored business payloads. The brochure import helper retains this adapter when regenerating a supplied design.

Configure `SUBMISSION_CHALLENGE_SECRET` with at least 32 random characters on mainweb, or use the existing `ADMIN_SESSION_SECRET` fallback. No signing secret is sent to the browser. Missing configuration fails closed. Replay tracking and request rate limiting are process-local; the arithmetic challenge is not a third-party bot-detection service.

Validation errors return failure and HTTP 400 through the reference transport. Known rate-limit/not-found errors keep their status. Database unavailability returns failure/503 for the public reference actions. Success follows a completed database save. Email delivery failure does not turn an already-persisted contact/registration into a false save failure. Actual external email delivery was not exercised during verification.

Anonymous registrations no longer attach to the local mock administrator. Legacy identity/profile mutations require the existing signed administrator session. Persisted profile names are read back instead of being overwritten by the old static display names.

## Database changes and abstract documents

Migration `20261105000400_public_abstract_submissions` adds `PublicAbstractSubmission` without changing/deleting existing submissions. It stores validated metadata/consents/co-authors as JSON, the reference/status, original filename/type/size, and document bytes in the shared database. Submission plus audit creation is transactional. There are no new public-user accounts created or existing author accounts overwritten for anonymous submissions.

The reference admin records view, retained abstract-review view, status controls and analytics include these submissions. List queries omit document bytes. The authenticated, conference-scoped `/conference-admin/api/portal/<slug>/files?id=<id>` handler returns the original document with attachment headers. Both Prisma schemas/clients are aligned.

Historical JSON backups and their metadata remain available. Those old records still cannot supply document bytes that were never uploaded. Document word counts and scientific eligibility remain manual review steps, consistent with the public upload instructions.

Registration no longer catches a failed database transaction and claims successful storage in a local JSON fallback. Existing historical backup files are retained. Conference/package/country relationships are checked instead of creating records from arbitrary client identifiers.

## Verification evidence

- Focused tests cover field boundaries, Unicode names, malformed numeric/date inputs, conditional requirements, consent, renamed/oversized files, unpublished tracks, token tampering/expiry/reuse, server totals, action responses, profile field mapping, identity boundaries, document links/headers and regeneration adapters.
- Existing form-state and submission-adapter checks pass. Historical source-fidelity checks remain separate: the repository already has branding drift, and this change intentionally adds verification adapters.
- Both projects are production-built and type-checked; the admin session-security suite is also run.
- Browser checks cover the login at desktop/390px, masked passwords, invalid credentials, controlled phone fields, integer inputs and server challenges, with no runtime exceptions. The final registration browser request was inspected/intercepted to verify signed challenge fields without creating a real registration.
- Real public actions were run against the shared database inside an outer transaction: registration fields/accommodation/invoice/server totals, partnership fields, abstract metadata/document bytes, brochure/query fields/consent and failure responses were checked.
- The real admin document handler returned identical PDF bytes and rejected unauthorized access. Profile creation/update/clearing and database-failure retry were checked.
- The outer transaction rolled back all verification registrations, contacts, public abstracts, profiles, organisations, invoices and audit writes. No verification email was sent.
- Reports and login screenshots are retained locally in ignored `scratch/validation-qa/`. A transient database connection failure occurred during one verification attempt; the retry passed, and the failure path reports an error rather than success.

Deploy/rebuild both projects to publish these local code changes. The additive migration was applied to the configured shared mainweb database during this work. No production host deployment was performed by this session.

Final results: 72 focused tests passed, 6 existing form-state/adapter checks passed, 3 admin security tests passed, and both production builds passed. For deployment, configure the verification secret described above and allow uploads through the reverse proxy up to the configured document limit plus multipart overhead; the Next server-action cap is 12 MB.
