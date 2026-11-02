# Public conference website — Next.js
Registration, abstract document submission, brochure download and query, scientific tracks, and organizing committee pages.

1. Use Node.js 22.13+ (Node.js 24 recommended).
2. `npm ci`
3. Copy `.env.example` to `.env.local`. Copy FORM_API_KEY from the admin configuration. It is server-only: never prefix it with NEXT_PUBLIC_.
4. `npm run dev -- -p 3000` or `npm run build` then `npm start -- -p 3000`.

ADMIN_API_URL is the internal address of the admin backend; ADMIN_PORTAL_URL is its public browser address. The public application forwards only public settings/assets reads and submission creation. It never forwards admin cookies, record listings, private documents, or settings edits.

Public pages are in public/. Editable original Next.js sources for the brochure, tracks and committee pages are in editable-page-sources/. Those pages are included as prebuilt assets; rebuild their sources when changing their React design. The registration and abstract pages can be edited directly as HTML.

See ../START-HERE.md for the full two-project setup and integration limits.
