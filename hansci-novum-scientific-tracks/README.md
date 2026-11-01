# Hansci Novum — Scientific Tracks & Sessions
Next.js App Router with React state and plain CSS. Node.js 20.9+.

Run: npm ci, then npm run dev.
Open http://localhost:3000/scientific-tracks/.
Build: npm run build (or npm run build -- --webpack).
Upload out/ contents under /scientific-tracks/. Remove basePath and rebuild for root hosting.

Includes twelve proposed hematology tracks, topic search, area filtering,
expandable topics, oral/poster information and abstract submission links.
All scientific content is editable in TRACKS in app/page.jsx. Tracks are proposed,
not an approved programme. No speakers, schedules or chairs are invented.
Adapt navigation to your own registration, abstract and brochure URLs.
When used independently, sibling-page links require those pages to exist.
Styles use generic selectors; scope them when merging with an existing design.
No backend or email service is needed for the track browser.
