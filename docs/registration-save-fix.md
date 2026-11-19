# Registration save failure — 19 November 2026

## Cause

The browser's registration review step displayed `Failed to save registration. Please try again.` The current application writes `Registration.guestCheckoutHash`, but its configured application database had only the four migrations preceding `20261107000100_paypal_checkout`. The column and three checkout support tables were absent. Database connectivity itself was healthy.

## Reviewed operation

Read-only preflight verified PostgreSQL 18.7, successful migration history, and checksum equality for all four applied migration files. There were zero existing PayPal payments, duplicate PayPal registration groups, or mismatched PayPal invoices.

After explicit execution approval, a PostgreSQL 18 custom-format backup was created and its catalog verified using `pg_restore --list`. This verifies backup readability and expected objects; a full restoration was not performed. The existing pending migration was then deployed using the same explicitly selected datasource as the preflight. No migration source or historical checksum was edited.

Applied migration: `20261107000100_paypal_checkout`.

SHA-256: `28040a0d597eda2d5338f56ab2ecdc4032707687fbc5d9069a5454f32696cbd2`.

## Verification

- Migration history records the pending migration as successfully finished with the expected checksum.
- `Registration.guestCheckoutHash` now exists and the application's Prisma client can read it.
- `PaymentWebhook`, `PaymentOutbox`, and `RequestBucket` exist.
- Registration, payment and invoice counts are unchanged before/after deployment.
- The running local application's health endpoint reports `UP` and `CONNECTED`.
- No synthetic registration was retained, no email or provider request was made, and no payment feature flag or merchant setting was changed.

The backup and nonsecret verification report are retained locally under ignored `backups/registration-schema-2026-11-19T14-02-58-575Z/`. The database dump contains application data and must remain private.

Close the existing error dialog and retry saving. If the signed form verification has expired, request a new challenge and complete it before retrying. A real browser registration was not submitted during verification.

The earlier isolated PostgreSQL report remains historical: this operation applies the already-reviewed migration to the configured application database; it does not perform PayPal Sandbox testing or authorize Live activation.
