# Hansci Novum — Organizing Committee (Next.js)

Run with Node.js 20.9+: npm ci, then npm run dev.
Open http://localhost:3000/organizing-committee/.
Build: npm run build (or npm run build -- --webpack).
Upload out/ contents under /organizing-committee/.
For root hosting remove basePath from next.config.mjs and rebuild.

All profiles are explicitly labelled placeholders. No real appointments,
affiliations or biographies are claimed. Replace MEMBERS in app/page.jsx with
approved names, roles, affiliations, countries, expertise and biographies.
Add consented photos to public/ and set each photo field to the correct URL,
e.g. /organizing-committee/member-photo.jpg. Current placeholders use role initials.
When adding real members, replace the visible 'Member name to be announced'
headings with m.name (card) and selected.name (dialog), and update pending labels
and preview notices after confirming appointments.

Includes role filtering, profile search, native accessible biography dialogs,
responsive cards and links to tracks, abstract submission and registration.
Adapt sibling links to your actual site routes. Scope global CSS when integrating
into an existing Next.js project. No backend is needed for these profile features.
