# Conference checkout payment methods

The registration checkout now starts with an explicit Payment Method choice. PayPal and Stripe have local SVG wordmarks, names, availability descriptions and accessible radio controls. No method is preselected. The selected card receives a border, background, native checked state and Selected label. The layout wraps on narrow screens and Continue is disabled during loading/selection submission.

The registration review page now replaces the old Payment setup details popup with provider guidance and a Save and choose payment method action. Once a positive-priced, non-quote registration is saved, it navigates to the selector even when PayPal is off, so the actual server-controlled unavailable states are visible. No provider flag is enabled by navigation. Quote requests stay on a saved-request confirmation path. Save failures remain retryable, and successful checkout navigation does not open the obsolete saved/preview dialog.

`GET /ICGIT/hanvo/checkout/<registration UUID>` requires the existing guest ownership cookie, applies rate limiting and returns only method availability, a CSRF token and the saved server-priced registration total/currency. It does not create an order or contact a provider. `POST` to the same route accepts only an allowlisted provider, requires exact Origin/cookie-bound CSRF and ownership, rechecks server availability, and dispatches to the implemented flow. Unknown providers and extra amount/currency/status fields are rejected. Selection itself does not write payment or registration state.

PayPal availability requires valid existing provider configuration/Live approval gates and at least one enabled create/capture operation. This preserves capture-drain mode; actual create and capture retain their separate operation gates. If both are paused, or configuration is missing, the PayPal option is disabled. Check existing PayPal payment status remains available through the existing ownership-bound status endpoint. Its status-only UI never starts an order or loads payment buttons.

After selection, the existing PayPal component and create/capture handlers continue to use saved server pricing, immutable payment snapshots, idempotency, ownership and authoritative provider verification. New browser requests explicitly send `provider: PAYPAL`; the PayPal handler rejects Stripe/unknown providers. Omitted provider values retain PAYPAL as a backward-compatible default on that provider-specific endpoint. The new selection endpoint requires an explicit provider.

PayPal loading, verified-success, failure, pending and buyer-cancellation messages remain in place; capture approval now displays a verification message while awaiting the backend. Frontend responses cannot confirm a registration. The status-only view also handles already-paid and terminal states using the existing server response.

## Stripe prerequisites

Stripe is deliberately disabled regardless of any environment key. Source inspection found only a legacy generic service whose Stripe charge path is explicitly rejected: there is no working Stripe SDK, Checkout Session/PaymentIntent endpoint, signature-verified webhook handler or reconciliation implementation. Stripe selection is rejected on the backend, and nothing routes Stripe through PayPal or the disabled mock service.

Enabling Stripe requires a separate implementation/review:

- Choose Stripe Checkout or PaymentIntents and configure test-only secret/publishable keys plus its own webhook signing secret through secure server configuration.
- Add independent server endpoints using the existing registration pricing and ownership/CSRF checks; bind immutable amount/currency/registration data and provider references with retry-safe idempotency.
- Design cross-provider attempt coordination to prevent duplicate charges when switching between PayPal and Stripe. Add any necessary schema changes as separately reviewed migrations; none are introduced here.
- Verify Stripe webhook signatures against the raw body, deduplicate events, fetch authoritative provider state, and confirm registration/outbox records atomically. Handle cancellations, asynchronous results, refunds and reconciliation independently from PayPal.
- Add verified success/failure/cancel UX, test-mode integration coverage and any required CSP/redirect-origin policy before declaring availability. A browser return URL or success callback must never mark a registration paid.

No Stripe key alone enables the UI. Existing registration records, database services, deployment and Live flags were not modified for this change. No migration or real payment/provider request was executed.

## Validation

Provider-selection HTTP tests cover server totals, ownership, CSRF, strict request validation, availability changes, unavailable Stripe and capture-drain mode. UI tests cover explicit selection, unavailable Stripe, server dispatch, failure display and status-only access without creating orders. The existing PayPal route suite also rejects Stripe at the PayPal endpoint.

Initial selector validation: 221 passed, the same five existing reference-fidelity failures, 15 gated integration skips. TypeScript and the Next.js production build passed. Targeted lint passed for all six changed selector runtime files with no warnings/errors; the full repository lint was not rerun. After correcting the registration-page handoff, TypeScript passed again and root regressions finished with 227 passed, the same five failures and 15 skips. Four new DOM tests cover the actual registration script and two action tests cover disabled-PayPal navigation and quote exclusion. No Docker/PostgreSQL or real PayPal Sandbox tests were opted in for these changes. Responsive behavior is implemented with wrapping layout and native radio controls; no device/browser walkthrough was performed in this task.
