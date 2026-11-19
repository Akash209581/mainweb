# PayPal browser Sandbox setup — 19 November 2026

The user authorized Sandbox setup and created a US Personal Sandbox buyer plus a Sandbox Business app. Credentials are stored privately in `.env.sandbox.local`; never print them. Live activation is not authorized.

A fresh PostgreSQL 16.14 test container/volume was provisioned using the reviewed fresh-database isolation helper. All five migrations and sample conference seed completed. The existing application database/containers were not reused or changed. Nonsecret provisioning evidence is in ignored `scratch/paypal-phase3-5a95dd2527a20a43579a79c65abf7679-evidence.json`.

The isolated app runs on loopback port 3002 using `.next-sandbox` output. Emails and admin login are explicitly disabled in its environment. The normal port-3000 app is unchanged. Startup uses `node --env-file=.env.sandbox.local scratch/start-paypal-browser-sandbox.cjs`; the runner rejects nonlocal/non-test datasource identities and Live mode. Next.js added `.next-sandbox/types/**/*.ts` to tsconfig.

A webhook-only proxy runs on loopback port 3003. Only POST `/ICGIT/hanvo/paypal/webhook` is forwarded, with bounded request bytes and PayPal signature headers; all other paths return 404. It does not expose public/admin pages. Cloudflare's official Windows tunnel executable was downloaded into ignored `scratch/tools/` and its SHA-256 matched official GitHub release metadata (2026.11.1).

Current temporary webhook URL:

`https://proxy-bacon-external-preview.trycloudflare.com/ICGIT/hanvo/paypal/webhook`

The URL depends on the current tunnel process and will change when a new quick tunnel is created. Runtime session/port information is recorded without secrets in ignored `scratch/paypal-sandbox-runtime.json`.

Pending: the user must register this URL on the same Sandbox app and save its webhook ID in `.env.sandbox.local`. Checkout, capture, webhook processing and reconciliation are still disabled. After webhook registration, validate Sandbox credentials, enable only the isolated Sandbox operations, and restart only the test app with its explicit config. Perform buyer approval through the real SDK with the US Personal Sandbox login. Do not use the existing port-3000 registration or normal application database for test payments. Do not paste credentials or tokens into logs/chat.

Verified so far: isolated app health UP / CONNECTED; proxy rejects admin paths. No PayPal provider request or test payment has been made during infrastructure setup. No Live flag was enabled. Test resources are preserved; no cleanup/deletion was performed.

## Sandbox enabled after webhook registration

The user saved a webhook ID in the main `.env`; it was copied to `.env.sandbox.local` without displaying it. PayPal Sandbox OAuth authentication succeeded. A read-only webhook API lookup verified that the webhook belongs to the configured Sandbox app, its URL matches the active temporary tunnel, and required approval/capture-completed events are subscribed.

Only `.env.sandbox.local` now enables create, capture, webhook and reconciliation switches. Live approval remains false. The isolated app alone was restarted on port 3002. Credentials and flags in the normal app were not changed by this activation. Its active runtime session information is in `scratch/paypal-sandbox-runtime.json`.

Readiness checks passed: test database UP/CONNECTED, registration page HTTP 200, and an unsigned empty request through the public webhook tunnel returned HTTP 400. That negative check does not simulate a genuine signed PayPal event and is not evidence of a completed payment.

No order or payment has been created by these activation checks. The next step is user-driven approval through the real Sandbox SDK: open `http://localhost:3002/ICGIT/registration`, use test participant details with a supported non-IN country, save, select PayPal, continue and sign in using the separate US Personal Sandbox buyer. Confirm the test payment, then inspect the isolated database and signed webhook outcome. Email sending remains disabled. Do not enable automated maintenance or Live as a side effect.

## First captured Sandbox payment: pending seller acceptance

After buyer approval, the latest Sandbox order reported COMPLETED with exactly one capture; the capture API itself reported PENDING with `status_details.reason=RECEIVING_PREFERENCE_MANDATES_MANUAL_ACTION`. The application correctly recorded PROCESSING and left registration PENDING. The test database was reachable during diagnosis. Order COMPLETED is not sufficient evidence that the capture has settled; do not mark this registration confirmed or submit another capture.

The next operator action is to inspect the existing EUR 399 test payment in the Sandbox Business seller's Activity and accept it if PayPal offers that action. Receiving-currency preferences are a possible cause of manual acceptance, not independently confirmed by the API. The normal Live merchant must remain unchanged.

Real webhook requests had returned HTTP 400. A concrete validation defect was identified: `lib/paypal/service.ts` accepted only uppercase certificate IDs, while PayPal's documented certificate URLs contain lowercase hex. The path character allowlist now accepts both cases; HTTPS/PayPal-host/path allowlisting and official signature verification remain mandatory. Added regression coverage for a documented lowercase certificate ID and rejection of lookalike hosts, query parameters and HTTP. The three focused payment service/security/route suites passed all 56 tests. Actual post-fix signed delivery and final payment settlement still require verification.

The reported Prisma closed-connection log lines alone do not establish a payment failure. This diagnosis verified the isolated test database directly; it did not change normal application database connection settings.

## Automatic browser confirmation

The PayPal checkout now polls the existing authenticated status endpoint after buyer approval, while PROCESSING, in status-only mode, and after an uncertain capture response. The first follow-up is after five seconds, normal checks are ten seconds apart, and failed checks back off to thirty seconds. Returning focus to the checkout tab also checks immediately. Requests do not overlap; timers, focus listeners and read requests are cleaned up on navigation.

Automatic follow-ups use GET only. They never create another order or repeat a capture. Polling stops on verified PAID or a terminal outcome. A server-verified PAID response displays a green `Payment successful` notice with registration confirmation; pending/manual-acceptance states never imply success. The manual status button remains as an optional fallback and is hidden after success.

Validation: 13 focused checkout UI tests passed, covering automatic success, pending seller acceptance, temporary errors/backoff, focus refresh, cleanup, terminal failure, request concurrency and uncertain-capture reconciliation without another POST. TypeScript and scoped component lint checks passed. No real or Sandbox payment was initiated by these mocked UI tests.

## Webhook delivery recovery

The owner explicitly approved restoring a temporary Cloudflare tunnel carrying Sandbox webhook payloads after automatic approval review required explicit consent for that data flow. Only the existing webhook path is forwarded; site/admin routes remain blocked.

Read-only checks found the local app/proxy stopped and Docker unavailable. Docker Desktop was restarted, then only the existing test container was started. Its full container ID, immutable image and volume matched the original evidence. Docker reassigned the loopback database port from 59722 to 59215. The actual database name and restricted role were verified before updating only the private Sandbox datasource URLs. All five test payment records were preserved; no replacement database or migration was created.

The isolated app and webhook-only proxy were restarted. A new temporary HTTPS URL was generated and only the existing PayPal Sandbox webhook URL was updated; its ID/subscriptions and all Live settings were preserved. The active URL and sessions are in ignored `scratch/paypal-sandbox-runtime.json`.

The restored app reported database UP/CONNECTED; registration returned 200 and an unsigned public webhook request was rejected with 400. PayPal was then asked to redeliver precisely the existing PAYMENT.CAPTURE.PENDING and CHECKOUT.ORDER.APPROVED events shown in the owner's dashboard. Both requests returned 202. Both genuine signed events subsequently passed verification and were recorded in the isolated `PaymentWebhook` table. Evidence: ignored `scratch/paypal-webhook-redelivery-result.json`.

The captured test payment remains PROCESSING and its registration PENDING: the provider previously reported seller manual acceptance is required. Successful webhook delivery does not imply settlement. No additional order, capture, refund, email, or Live change was performed during recovery.

Quick-tunnel URLs and Docker-assigned random host ports can change after restarts. Restarting the browser alone cannot restore these backend services. For deployment, use a permanently hosted backend/database and stable HTTPS webhook URL; for local recovery, verify the actual test-container binding and current tunnel before redelivery.
