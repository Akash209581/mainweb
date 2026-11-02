# Hansci Novum — separate Admin Portal and User Website

These are two independent Next.js projects with separate ports/deployments and one shared admin backend.

## Start locally
1. In admin-portal: `npm ci`, `npm run setup`, then `npm run dev -- -p 3001`.
2. In user-website: `npm ci`, copy `.env.example` to `.env.local`, and copy the generated admin FORM_API_KEY into it. Then `npm run dev -- -p 3000`.
3. User website: http://localhost:3000. Private admin: http://localhost:3001/admin.

For deployment, set admin PUBLIC_SITE_URL to the website URL. In the website server environment set ADMIN_API_URL to the reachable admin backend origin and ADMIN_PORTAL_URL to the public admin origin. Set identical strong FORM_API_KEY values on both servers. Keep SESSION_SECRET and admin password hash private. Run `npm run build` then `npm start` in each project. Use Node.js 22.13+ and persistent admin storage. Preserve the browser Host/Origin headers through your reverse proxy. Never upload the projects to a static-only host.

The public website saves registrations, abstracts, brochure requests and queries to the admin database. Admin changes to prices, documents, tracks and committee members are read by public pages. Private admin authentication and private documents remain on the admin server.

## Included behavior and limits
- Currency USD, EUR or GBP; registration and eligible accommodation together; exhibition and sponsorship categories.
- Abstract upload, highlighted sample download, 500–600-word guidance, country-code phone field, oral/poster preferences, thank-you screen without a reference number.
- Brochure requests and queries; scientific tracks; organizing committee.
- Terms checkbox and demonstration CAPTCHA are UI features. Replace CAPTCHA with a server-verified provider before accepting public traffic. Uploaded abstract word count is guidance, not automatically extracted/enforced from PDF/DOCX.
- No payment gateway is connected. Submission confirmation does not mean payment was collected.
- No email provider is connected. Thank-you email templates are included, but automatic emails require provider integration; API reports emailSent:false.
- Seed conference content, prices and member placeholders are examples; replace them in the portal before publishing.
- This code does not automatically change an existing live domain or hosted website.

Each project is independently deployable; the shared connection configuration is required for submissions and content to work.
