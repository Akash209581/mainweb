# Hansci Novum — Brochure Request (Next.js)

## Run
Node.js 20.9+.
```
npm ci
npm run dev
```
Open http://localhost:3000/brochure/.

## Build
```
npm run build
```
The built static site is in `out/`. Deploy its contents under `/brochure/`.
For a domain-root deployment remove `basePath` from next.config.mjs and rebuild.
The included build used `npm run build -- --webpack`.

## Attach the real brochure
The approved conference PDF was not provided. The final download button is
therefore disabled; it does not point to a missing or invented brochure.
1. Add your approved PDF as public/conference-brochure.pdf.
2. Set BROCHURE_URL in app/page.jsx to /brochure/conference-brochure.pdf.
3. Rebuild. Adjust this URL if changing basePath, or use an approved hosted PDF URL.
For cross-origin PDF URLs, download behaviour depends on the host response.

## Existing Next.js app
Copy app/page.jsx into your brochure route, merge/scope globals.css, and adapt
registration/abstract links to your existing routes. No UI libraries required.

## Included
Contact details with international phone; country; conference interest;
required privacy acknowledgement; separately optional updates consent;
local CAPTCHA preview; request form; thank-you screen; configurable PDF button.

## Before live use
This front-end preview does not save contacts or send email. Connect a backend,
server-side validation, production CAPTCHA, storage and transactional email.
Enable the real success screen only after the server confirms the request.
Record optional updates consent separately. Add final privacy text and policies.
Never put email-service secrets in this client component.
A brochure-link email template is provided in brochure-email-template.txt.
The cover is an illustrative design, not a representation of an attached PDF.

## Query button
A Have a query? button opens an accessible enquiry dialog, with name, email, subject and message fields. It demonstrates a thank-you state without sending or storing the query. Connect a backend and server-side validation before collecting live enquiries.
