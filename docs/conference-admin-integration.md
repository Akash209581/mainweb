# Conference admin integration

The existing `C:/Users/banda/Desktop/conference-admin` application remains the admin host. The supplied `Hansci/admin-portal` files remain unchanged. Both applications now use the mainweb database, as selected by the user; two additive registration migrations were applied and all existing registration IDs were preserved.

## Interface and preserved features

The supplied portal, records dashboard, settings editor, list editors and CSS were adapted into `conference-admin/components/reference`. A Shadow DOM isolates the supplied portal from the existing Tailwind reset. `scripts/sync-reference-styles.cjs` generates the embedded stylesheet before development and builds. The original stylesheet continues to theme retained management screens.

The portal provides overview, registrations, abstracts, brochure requests, queries, conference display details, registration/accommodation prices, document uploads, abstract settings, policies, tracks and committee profiles. An additional Public page text screen edits text nodes across the five approved public pages, preserving controls and markup. Search locates individual text fields. Dynamic facts and profile collections retain their dedicated editors.

The expandable Website & Operations navigation preserves website sections/navigation/footer/branding, conference configuration, speakers, media, SEO, registration management, abstract review, revenue/payments, activity history and conference analytics. Historical registration backups remain visible alongside database records, without duplicate IDs/reference numbers. Registration details include partnership, accommodation, billing, country, phone and fee data. The previous overview remains at `/<slug>/analytics`. Retained editors keep their existing functionality within the reference navigation and palette; they have no corresponding supplied reference form to copy.

## Shared settings

| Portal control | Existing/new SystemSetting key |
| --- | --- |
| Conference display details | `conference_display` |
| Registration prices | `registration_pricing` |
| Accommodation | `accommodation_pricing`, also mirrored inside registration pricing |
| Abstract requirements | `abstract_settings` |
| Privacy and terms | `policies` |
| Scientific tracks | `scientific_tracks` |
| Organizing committee | `organizing_committee` |
| Documents | `document_assets` |
| Approved public page text | `approved_page_copy` |
| Record notes/workflow | `record_workflow:<type>:<id>` |

The public `/ICGIT/api/settings` reader overlays these database settings on the existing file/default fallback. Canonical database pricing and abstract values take precedence over old local aliases. Unpublished database track/member entries are excluded from the public response. The public text adapter changes plain text only and preserves headings with line breaks, forms and event handlers. The supplied page sources are unchanged.

New settings and text saves use optimistic versions, serializable transactions and audit logs. The retained content endpoint now uses a transaction and reports database failures rather than claiming publication. Existing content/branding/media/SEO database contracts are retained. Registration totals now read the saved `registration_pricing` settings on the server, use integer cents, and respect configured zero accommodation rates.

New public abstract submissions now save validated metadata and original document bytes in `PublicAbstractSubmission`. Historical JSON backups remain available; bytes that were never uploaded cannot be recovered. See [validation and persistence](validation-and-persistence.md) for the current submission path.

ContactMessage has no conference relation. Brochure/query records and unscoped abstract backups are assigned only to `CONTACT_CONFERENCE_SLUG` (default `icgit-2026`), rather than exposed in every conference.

## Security and configuration

Admin sessions are HMAC-signed, expire after eight hours, require a configured secret of at least 32 characters, and use HttpOnly/SameSite cookies plus Secure in production. The signing secret is never returned to the browser. There is no predictable fallback session. Login is rate limited per process. Reverse-proxy deployments can set `ADMIN_ORIGIN` and `PUBLIC_APP_ORIGIN` for strict origin checks.

Middleware, protected layouts and API handlers check sessions. The old mainweb admin entry redirects to the separate portal. Mainweb record/upload APIs and the former mock-super-admin role helper now require a signed session. Public settings writes are forbidden. Public conference submission forms remain available. Mainweb and admin share `ADMIN_SESSION_SECRET` locally, with cookies scoped to the host root for the two applications.

Uploads validate destination folders, extension, file signature and size. The new document/photo path uses randomized filenames and database-backed asset references, with attachment responses and traversal checks. Documents and committee photos use `SHARED_UPLOADS_DIR` in both apps; its default points to mainweb's `public/uploads` folder for this sibling-directory setup. Use a shared writable volume when deploying separately. Public brochure/sample downloads use `/ICGIT/api/assets`.

`DATABASE_URL` in conference-admin was changed to the existing mainweb connection with explicit user authorization. The direct connection was aligned with that endpoint. The direct endpoint was unreachable during verification, so migration commands used a process-local override to the proven pooled connection with advisory migration locking disabled for the single controlled migration process. Existing local admin credentials were retained. No credentials are included in this document or tracked files.

Local development: run `npm.cmd run dev` in each project. The admin is at `http://localhost:3005/conference-admin`. The mainweb `/ICGIT/admin` entry redirects there by default. Set `ADMIN_PORTAL_URL` and `NEXT_PUBLIC_WEBSITE_URL` for deployed URLs; those local defaults are intended for this workstation.

## Registration schema compatibility

The selected database matched the initial enterprise schema but had no Prisma migration-history table. After a read-only comparison, the existing initial schema was baselined and these migrations were applied:

- `20261105000100_registration_details`: adds the already-declared mainweb registration detail columns and reference indexes, permits registrations without a package, and updates the package foreign key accordingly.
- `20261105000200_registration_phone`: adds an optional phone field so the form value survives validation and database persistence.

Both Prisma schemas/clients are aligned. No tables, columns or existing registrations were deleted. Existing registration IDs were checked after migration. The actual registration-save code was verified inside a rolled-back transaction using changed admin prices: decimal cents, accommodation nights/rooms, totals and phone persistence were checked; no verification registration or temporary pricing was retained.

## Verification

- Final production builds passed for both applications, including the isolated reference UI.
- Admin session/validation suite: 3 passing tests.
- New public access/settings/text/pricing tests: 13 passing tests.
- Existing interaction/adapter checks: 6 passing tests. The 5 existing source-fidelity comparisons fail because the supplied user-website source files have branding differences from the already-integrated copies; those source files and integrated designs were not changed by this work.
- Browser checks cover configured login, anonymous and cross-origin rejection, record status edits, pricing payloads, document/track/committee/text screens, section URLs, mobile width and runtime errors. Browser form mutation responses use fixtures rather than publishing test content.
- The actual portal settings-save implementation was executed against the mainweb database inside an outer transaction. Its saved values were reread successfully, all writes/audit entries were rolled back, and original settings were verified unchanged.
- Real database reads succeeded. A database write/read transaction intentionally rolled back; the verification key was confirmed absent afterward.
- Real admin API checks passed for settings/records reads and rejection of invalid settings, stale settings/text versions, disallowed document types and upload traversal. No test content was published.
- Public production smoke checks passed for settings reads, registration rendering, legacy admin redirection, anonymous records/upload rejection and forbidden public settings writes.
- Reports/screenshots are in ignored `scratch/admin-qa/`; focused public tests are in `test/admin-access.test.ts`, `test/shared-settings.test.ts` and `test/page-copy.test.ts`. Admin tests are in `conference-admin/tests/security.test.cjs`. Server-pricing tests are in `test/registration-pricing.test.ts`.

Real payment processing, email delivery, participant-submitted abstract file storage, and production deployment were not changed or certified by this UI integration. A build and focused security checks are not a complete penetration test. No live registration, submission, payment or conference content was edited for verification.

## Download and retained-screen corrections

Historical sample-abstract and brochure TXT links now resolve to the published document endpoint. The reference surface removes stale download filename attributes even when links appear after a form submission. Both public and authenticated document endpoints use the stored extension to return the correct MIME type, an ASCII filename fallback plus UTF-8 filename, and no-store caching. A missing uploaded file returns 404 instead of substituting a TXT placeholder. The dormant legacy brochure layout also uses the published document endpoint.

The retained management screens use `components/admin/layout/reference-theme.css`. Exact utility-token selectors replace the former substring rules, which incorrectly treated `bg-indigo-50/50` as `bg-indigo-500` and darkened light panels. Primary controls, headings, borders, preview surfaces and gradients now follow the reference navy/light palette without removing editor controls.

Verification: 9 document/link/endpoint tests and 4 existing text-editing tests passed. Browser checks saved sample/brochure PDF fixtures with correct filenames and bytes, and checked desktop/mobile content-editor contrast without runtime errors. No uploaded production document was replaced for testing. Deploy both mainweb and conference-admin to update the public download logic and the separate admin stylesheet. Both processes still need access to the same uploaded document volume.

## Login and public input verification update

The login now uses the reference theme. Public forms have matching client/server validation, signed arithmetic challenges, truthful database failure responses, and database-backed abstract document storage with private admin downloads. Profile fields are saved together and anonymous callers no longer inherit the mock administrator. Current implementation and verification details are in [validation-and-persistence.md](validation-and-persistence.md).
