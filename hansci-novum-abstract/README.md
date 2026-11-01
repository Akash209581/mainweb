# Hansci Novum — Abstract submission (Next.js)

App Router, React client component and plain CSS. Requires Node.js 20.9+.

## Run
```bash
npm ci
npm run dev
```
Open http://localhost:3000.

## Build / upload
```bash
npm run build
```
The `out/` folder contains the static export; upload its contents to a static host.
A built copy is included. Do not upload JSX files as HTML.
For a Node server, remove `output: 'export'`, rebuild, then use `npm start`.

## Integrate into your existing Next.js project
- Copy `app/page.jsx` to your route, e.g. `app/abstract/page.jsx`.
- Merge `app/globals.css` into your root stylesheet (scope its generic selectors
  when integrating into a different site design).
- Copy `public/sample-abstract.txt` into your public folder. For a nested route,
  change its relative link to `/sample-abstract.txt`, or the correct base-path URL.
- Update scientific tracks, event details, policies and navigation links.

## Included
Highlighted sample download; contact fields including international phone;
co-authors; oral or poster preference; required PDF/DOC/DOCX document (5 MB);
500–600 word guideline; required declarations and terms; local CAPTCHA preview;
review screen; thank-you screen with no reference number.

The page retains the selected document when returning from review; no text box,
ORCID, department, keywords or suggested structure is included.

## Before accepting live submissions
This is a front-end preview. Data stays in React state, documents are not uploaded,
and no email is sent. File type/size validation is client-side only. Document word
count is a guideline and is not automatically extracted or validated.
Connect a backend to validate inputs and terms, scan and store documents securely,
verify a production CAPTCHA, and send the thank-you email only after successful
storage. Use the included thank-you-email-template.txt as a starting point.
Keep credentials server-side, never in this client component.
Show the real success screen only after the server confirms success, and provide
an error/retry state if saving fails. Finalise privacy and submission terms.
