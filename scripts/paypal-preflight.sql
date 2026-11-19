-- READ ONLY. Do not run against an application/production database without
-- separate explicit authorization. No connection string belongs in this file.
-- Uses pre-migration columns only. Results are aggregate counts, not participant data.
BEGIN TRANSACTION READ ONLY;
SELECT current_setting('server_version') AS postgres_version;
SELECT count(*) AS existing_paypal_payments FROM "Payment" WHERE "provider" = 'PAYPAL';
SELECT count(*) AS duplicate_paypal_registration_groups FROM (
  SELECT "registrationId" FROM "Payment" WHERE "provider" = 'PAYPAL'
  GROUP BY "registrationId" HAVING count(*) > 1
) duplicates;
SELECT count(*) AS duplicate_paypal_reference_groups FROM (
  SELECT "providerRef" FROM "Payment" WHERE "provider" = 'PAYPAL' AND "providerRef" IS NOT NULL
  GROUP BY "providerRef" HAVING count(*) > 1
) duplicates;
SELECT count(*) AS mismatched_paypal_invoices FROM "Invoice" i
JOIN "Payment" p ON p."id" = i."paymentId"
WHERE p."provider" = 'PAYPAL' AND (
  p."registrationId" IS DISTINCT FROM i."registrationId" OR
  p."amountCents" IS DISTINCT FROM i."amountCents" OR p."currency" IS DISTINCT FROM i."currency"
);
COMMIT;
