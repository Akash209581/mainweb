# Hansci Novum — Complete Admin Portal (Next.js)

A standalone Next.js App Router application containing the unified Admin Portal,
connected conference forms and website pages. No ChatGPT/Sites account or
Cloudflare binding is required by this package.

## Quick start
Install Node.js 22.13+ (Node.js 24 LTS recommended), then open a terminal in this folder:

```bash
npm ci
npm run setup
npm run dev
```

Setup asks for your administrator email and a password of at least 12 characters.
The password is hidden. Setup generates `.env.local` with a password hash and
session secret. Do not share or commit that file. There is no default password.

Open:
- Website: http://localhost:3000
- Admin Portal: http://localhost:3000/admin
- Login: http://localhost:3000/login

## Production deployment

This is a **server application**, not a static HTML export. It cannot run by
uploading the ZIP into a static-only public_html folder. Your host must support
Node.js and a persistent disk/volume (VPS or suitable Node hosting).

```bash
npm ci
npm run setup
npm run build
npm start
```

Configure HTTPS through your host/reverse proxy, preserving the public Host and
Origin. Production session cookies require HTTPS. Set DATA_DIR to an absolute,
persistent writable directory, for example `/var/lib/hansci-conference`.
Back up that entire directory, including the SQLite database and uploaded files.
Do not expose DATA_DIR as a public web directory.

For Docker, build with the supplied Dockerfile, mount a persistent volume at
`/app/data`, and provide ADMIN_EMAIL, ADMIN_PASSWORD_HASH and SESSION_SECRET as
runtime environment variables. Generate them with setup on a trusted machine.
When entering environment variables directly in a hosting panel, use the actual
hash value with `$` characters, not the backslashes used in `.env.local` to escape
dotenv expansion. Keep these values private. Replacing SESSION_SECRET signs out
existing sessions.

This package uses one SQLite database on one server. It is not designed for
stateless serverless hosting or multiple independent replicas without replacing
the storage adapter with a shared database/object store.

## Included management sections

- Registrations, accommodation details, abstracts/documents, brochure requests,
  and queries; search, status updates, internal notes and CSV export.
- Conference title, dates, venue, deadline and support email.
- Registration and room prices in EUR, USD and GBP.
- Sample abstract and brochure uploads/replacement.
- Abstract word guidelines and maximum upload size.
- Privacy and terms text.
- Scientific tracks/session topics: add/edit/remove/reorder/draft/publish.
- Committee members: profiles, roles, affiliations, countries, biographies,
  photo uploads, order, draft/published and placeholder status.

Changes saved in the portal update the included hosted pages on refresh.
Existing registration price snapshots are preserved. New registrations use the
current server-side prices. Saving a registration does not process payment,
reserve a room or confirm a sponsorship package.

## Storage and authentication

- `lib/storage.js`: SQLite and filesystem storage adapter.
- Data is created automatically on first use, under DATA_DIR (default `./data`).
- `lib/auth-core.js`, `lib/auth.js`: scrypt password verification and signed,
  HttpOnly, SameSite administrator session cookies; sessions expire after 8 hours.
- `/api/records` accepts public form submissions. Listing/updating records and
  downloading submitted abstracts require the administrator session.
- `/api/settings` exposes published page configuration, but writes/uploads
  require administrator authentication.
- Uploaded brochures, sample abstracts and published member photos are
  intentionally downloadable from the website. Submitted abstracts are private.
- CSRF Origin checks protect mutating requests. Login has a basic in-process
  attempt limit; use trusted reverse-proxy rate limits for a public deployment.

## Still not connected

Payments, transactional/thank-you emails and a production CAPTCHA provider are
not implemented. Current forms use a local demonstration challenge, which is
not production bot protection. Connect server-verified CAPTCHA and request rate
limits before collecting external submissions. Approve your privacy/terms text
before launch. Document word count is a guideline, not automatically extracted.
Uploaded files are checked for size/extension; no malware scanning is included.

These are source files with default/demo conference content, not a backup of
existing live records, saved live settings, uploaded documents or credentials.
Your current ChatGPT-hosted Site and hanscinovum.com are not changed by this ZIP.
Use the admin portal after setup to upload the real documents and enter content.

## Source map

- `app/admin/portal.jsx`: unified navigation and workspace.
- `app/admin/dashboard.jsx`: records, details, notes and export.
- `app/admin/settings/`: pricing, content, document and collection editors.
- `app/api/`: login, records, settings and document endpoints.
- `app/content-defaults.js`: initial proposed tracks and committee placeholders.
- `public/index.html`: registration form.
- `public/abstract.html`: document-only abstract submission form.
- `public/site-content.js`: reads saved settings into the HTML forms.
- `public/brochure/`, `public/scientific-tracks/`, `public/organizing-committee/`:
  included prebuilt page assets; routes redirect to their index.html files.
- `editable-page-sources/`: React source projects for rebuilding those pages.
  Rebuild there and copy out/ into the corresponding public/ folder afterwards.

When merging into an existing website, preserve these API paths or update the
form URLs. Existing website integration is not performed by extracting the ZIP.

## Checks

```bash
npm test
npm run build
npm run test:integration
```

Integration tests run a real local Next.js server on port 3197 with temporary
credentials, a temporary database and temporary files. They never use live data.
