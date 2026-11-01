# Hansci Novum — Next.js Registration

Next.js App Router with a real React client component, plain CSS and no UI dependencies.

## Run
Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Visit http://localhost:3000.

## Build and upload

```bash
npm run build
```

The included configuration exports a static site into `out/`. Upload the contents
of `out/` to a static web host. Do not upload the source JSX as an HTML page.
`npm start` requires removing `output: 'export'` and rebuilding for a Node server.
For a subdirectory deployment, configure Next.js `basePath` for that directory.

## Use in an existing Next.js project
Copy `app/page.jsx` into your App Router route (for example `app/registration/page.jsx`).
Merge `app/globals.css` into your global stylesheet and import it from the root layout.
Styles target generic elements, so scope them before integrating into another design.
No changes to an existing website are performed by this package.

## Customise
- Edit `CATEGORIES` and `ROOMS` in `app/page.jsx` for approved prices in each currency.
- Update the conference title, dates, venue and policy text.
- Prices are independent illustrative amounts, not live exchange-rate conversions.
- Currency selection appears only on the category screen.
- Attendees can add venue accommodation. Room-only requests exclude admission.
- Exhibition and sponsorship use quote requests.

## Integration still required
This is a front-end preview. No registration is saved, room reserved, payment taken,
or confirmation email sent. Entries live only in React memory.
The local arithmetic CAPTCHA is a demonstration, not production bot protection.
Add a server-verified CAPTCHA provider, backend validation, approved prices and taxes,
registration storage, real policy documents, payment checkout/webhooks, availability
checks and confirmation emails before launch. Validate terms acceptance server-side.
Never place secret keys in client components or NEXT_PUBLIC variables.

The package uses Next.js 16 and React 19 version ranges; npm resolves their patches.
