# Approved page integration

The existing application remains the host. Five routes now render the supplied designs:

| Existing route | Supplied source under `Hansci_Novum/user-website` |
| --- | --- |
| `/ICGIT/registration` | `public/index.html` |
| `/ICGIT/abstracts` | `public/abstract.html` |
| `/ICGIT/brochure` | `editable-page-sources/brochure/app/page.jsx` and `globals.css` |
| `/ICGIT/sessions` | `editable-page-sources/scientific-tracks/app/page.jsx` and `globals.css` |
| `/ICGIT/committee` | `editable-page-sources/organizing-committee/app/page.jsx` and `globals.css` |

## Implementation

`components/approved-reference` contains the imported designs, supplied styles and integration adapters. `scripts/import-approved-reference.cjs <route-name>` regenerates a page from its original supplied source. Original reference files are untouched.

Shadow DOM isolates the supplied styles from the existing application's global `!important` typography rules and Tailwind reset. Per the subsequent navigation instruction, all routes retain the original site navbar, including its existing desktop/mobile behavior. Reference headers are hidden to avoid duplicate navigation, and an 80px offset accommodates the original fixed navbar. The five pages retain their supplied footers; `PageChrome` keeps the full existing shell on every other route. Page bodies require JavaScript. Existing server metadata remains available.

The HTML pages retain their complete markup, stylesheet and script. Their document queries are scoped to the page surface. React references retain their source JSX, with fetch/document adapters. Links point to the existing `/ICGIT` routes, including track query parameters. Fragment links scroll within the surface. The sample abstract download is copied without modification.

The only responsive correction is a minimum-width constraint on mobile grid children: the supplied abstract form overflows horizontally at 390px; the integrated form fits the supplied stacked layout. No copy, section, visual feature or breakpoint was added.

Reference submission requests call the existing registration, abstract, brochure and query server actions. Existing API contracts, schemas, authentication, services and repositories are unchanged. Existing editor keys for pricing, accommodation and abstract limits are mapped to the reference data model. Registration retains the existing database country query and fallback. Background rerenders retain entered HTML form values.

## Verification

The screenshot comparisons below were recorded before the requested restoration of the original navbar; the headers intentionally differ from those reference screenshots now.

- Source-fidelity tests compare complete HTML markup/CSS/scripts and React source/CSS against the supplied originals, excluding only the documented adapter imports.
- Browser comparisons use identical saved settings for both the supplied exports and integrated pages, at 1440×1000, 768×1024 and 390×844.
- Full-page screenshots match exactly for registration, tracks and committee. Brochure and desktop/tablet abstract differences are under 0.01% of pixels, with independently randomized arithmetic challenges. Abstract mobile dimensions differ because the supplied horizontal overflow is corrected.
- Browser interactions cover registration accommodation/invoice review; abstract track preselection, co-authors, local file selection and review; brochure query dialog and Escape; track search, expanded topics and submission links; committee profile dialog.
- All five pages were checked for overflowing elements at 320, 390, 768 and 1440px. The homepage retains its original shell. No browser runtime exceptions were observed.
- Screenshots and JSON reports are retained locally in `scratch/approved-reference-qa/` (ignored by Git).
- Type checking and focused application/integration tests are run separately. The unrestricted root Vitest discovery also picks up `hansci-novum-admin-portal/tests/core.test.mjs`, an existing `node:test` suite, and reports "No test suite found". This is a test-runner mismatch; the existing test configuration was not changed.
- Final checks: `npm.cmd run build` passed; TypeScript validation passed; `node node_modules/vitest/vitest.mjs run test/approved-reference.test.ts test/index.test.tsx` passed all 13 tests, including form-state retention across equivalent server rerenders.

## Existing limitations preserved

- `DATABASE_URL` is empty locally. Database-backed persistence and real email delivery cannot be verified in this environment. Browser checks block the existing content-version poll to avoid repeated refreshes from its database-error fallback.
- The existing public abstract action saves file name/size and submission metadata, not document bytes. The approved upload control and text remain unchanged; no document-storage backend or schema was invented. The separate authenticated upload service has a different contract and allowed-file list.
- No approved brochure PDF was supplied. The reference's unavailable-PDF state remains. Existing `.txt` resources remain on disk; the absent reference `/api/assets` service was not fabricated.
- Reference preview/payment/email notices remain verbatim, even where they differ from existing configured email behavior. Email hooks and payment-service code remain unchanged.
- Existing brochure/query actions report success even in their catch branches. That pre-existing behavior is unchanged; a success screen alone does not prove persistence.
- The supplied two-server proxy, admin project assumptions, framework versions and deployment configuration were not installed over the existing application. Dependencies were not upgraded and nothing was deployed.