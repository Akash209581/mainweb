# SMTP payment confirmation emails

The owner selected SMTP through GoDaddy, with sender `Hansci Novum <info@hanscinovum.com>`. Resend is not required when `EMAIL_PROVIDER=smtp`. The recipient is the saved registration email, not an address supplied by the PayPal browser callback.

## Private configuration

The domain's MX records point to `smtp.secureserver.net` and `mailstore1.secureserver.net`. GoDaddy's documented Professional Email settings use:

```env
EMAIL_PROVIDER="smtp"
SMTP_HOST="smtpout.secureserver.net"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="info@hanscinovum.com"
SMTP_PASSWORD="your mailbox password"
SMTP_FROM="Hansci Novum <info@hanscinovum.com>"
PAYMENT_EMAIL_FROM="Hansci Novum <info@hanscinovum.com>"
```

Save actual credentials only in the private `.env`. The SMTP password is the mailbox password/app password supplied by the mail provider, not the GoDaddy account login password. Do not paste it in chat or commit it. For a port-587 STARTTLS server, use `SMTP_SECURE=false`; encryption is still required. Certificate verification remains enabled. Debug/protocol logging and file/URL access are disabled.

Source: https://www.godaddy.com/help/set-up-third-party-plugins-or-websites-using-smtp-settings-42788

`npm run email:verify` checks TLS and authentication without sending an email. It loads `.env` through Node. After verification and an approved recipient test, run `npm run paypal:worker` as a supervised backend process, or schedule the existing one-shot maintenance command once a minute. Do not start multiple redundant schedulers. No worker is started automatically by this code change.

For the isolated Sandbox, set SMTP credentials explicitly in `.env.sandbox.local`, verify with `node --env-file=.env.sandbox.local --import tsx scripts/verify-smtp.ts`, and use `node --env-file=.env.sandbox.local --import tsx scripts/paypal-worker.ts`. A real SMTP server sends real emails even though the payment is simulated; use controlled recipient details for Sandbox registrations. Sandbox payment emails are labeled `[SANDBOX TEST]` and state that no real money was charged.

## Delivery behavior

A verified PAID transition confirms registration and creates its outbox job in one database transaction. Before sending, the worker checks PAID, CONFIRMED, capture identity and payment date. The email includes the saved conference/participant names, registration reference, verified amount/currency, payment reference and UTC confirmation date. Pending, failed, refunded and partially refunded payments do not receive a success confirmation from this job. This is a registration confirmation, not a tax invoice.

SMTP does not provide provider-side idempotency. A stable Message-ID helps trace a receipt but does not guarantee duplicate suppression. Definite pre-acceptance failures can retry through the existing queue. If sending may have succeeded (for example, the response is lost after DATA, the process crashes after send starts, or saving sentAt fails), the job is stopped at the retry limit for manual review. Inspect mail-server logs before resetting/resending it. This prevents automatic duplicate delivery at the cost of operator intervention for ambiguous cases.

The existing lease still prevents competing workers from sending the same queued job. Failed delivery never changes payment status to paid or confirmed. The optional legacy Resend transport remains available only when selected outside SMTP mode.

A hosted worker continues after the buyer closes the browser or shuts down their own device. A local developer machine hosting the worker cannot send while shut down; jobs persist until it restarts.

## Activation status

SMTP support, the GoDaddy host/port and requested sender are configured. The mailbox password has not been provided during implementation, so no real SMTP authentication or email-delivery test has been performed. Existing secrets were preserved. Delivery remains inactive until credentials and the worker are configured.
