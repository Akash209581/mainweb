# Private Admin Portal — Next.js
Dashboard, registration/abstract/brochure/query records, private document downloads, review statuses and notes, conference content, USD/EUR/GBP prices, accommodation rates, brochure/sample abstract uploads, scientific tracks and committee management.

1. Node.js 22.13+ (Node.js 24 recommended).
2. `npm ci`
3. `npm run setup` creates a private .env.local with your administrator email, password hash, session secret and FORM_API_KEY.
4. Set PUBLIC_SITE_URL to the user website origin.
5. `npm run dev -- -p 3001` or `npm run build` then `npm start -- -p 3001`.
6. Open http://localhost:3001/admin and sign in with the account created during setup.

Keep data/ on persistent storage and back up its SQLite database and files together. Never expose data/ as public static files. Use HTTPS in production; authentication cookies are Secure in production. For local production-build testing use HTTPS or the development server for browser sign-in.

See ../START-HERE.md. The separate user website submits through a server-only shared key. No public user pages are bundled in this admin project. Public links redirect to PUBLIC_SITE_URL.
