-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


SET lock_timeout = '5s';
SET statement_timeout = '30s';
ALTER TYPE "PaymentStatus" ADD VALUE 'APPROVED';
ALTER TYPE "PaymentStatus" ADD VALUE 'PROCESSING';
ALTER TYPE "PaymentStatus" ADD VALUE 'CANCELLED';
ALTER TYPE "PaymentStatus" ADD VALUE 'PARTIALLY_REFUNDED';
ALTER TYPE "PaymentStatus" ADD VALUE 'REVERSED';

BEGIN;

-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "guestCheckoutHash" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "captureRequestId" TEXT,
ADD COLUMN     "captureStartedAt" TIMESTAMP(3),
ADD COLUMN     "createRequestId" TEXT,
ADD COLUMN     "environment" TEXT,
ADD COLUMN     "lastReconciledAt" TIMESTAMP(3),
ADD COLUMN     "merchantId" TEXT,
ADD COLUMN     "operationUntil" TIMESTAMP(3),
ADD COLUMN     "paypalCaptureId" TEXT,
ADD COLUMN     "paypalOrderId" TEXT,
ADD COLUMN     "snapshot" JSONB,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PaymentWebhook" (
    "id" TEXT NOT NULL,
    "paymentId" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentOutbox" (
    "id" UUID NOT NULL,
    "paymentId" UUID NOT NULL,
    "sentAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "firstAttemptAt" TIMESTAMP(3),
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestBucket" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestBucket_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "PaymentWebhook_paymentId_idx" ON "PaymentWebhook"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentOutbox_paymentId_key" ON "PaymentOutbox"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentOutbox_sentAt_availableAt_idx" ON "PaymentOutbox"("sentAt", "availableAt");

-- CreateIndex
CREATE INDEX "RequestBucket_expiresAt_idx" ON "RequestBucket"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paypalOrderId_key" ON "Payment"("paypalOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paypalCaptureId_key" ON "Payment"("paypalCaptureId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_createRequestId_key" ON "Payment"("createRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_captureRequestId_key" ON "Payment"("captureRequestId");

-- AddForeignKey
ALTER TABLE "PaymentWebhook" ADD CONSTRAINT "PaymentWebhook_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentOutbox" ADD CONSTRAINT "PaymentOutbox_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Deliberately one lifetime PayPal payment per registration: no automatic replacement
-- after declines, cancellation, timeouts, or expiry. Never backfill existing registrations.
CREATE UNIQUE INDEX "Payment_one_paypal_registration" ON "Payment" ("registrationId") WHERE "provider" = 'PAYPAL';
CREATE INDEX "Payment_paypal_reconciliation" ON "Payment" ("provider", "lastReconciledAt");
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_paypal_snapshot_required" CHECK ((
  "provider" <> 'PAYPAL' OR (
    "amountCents" > 0 AND "currency" IN ('EUR', 'USD', 'GBP') AND
    "createRequestId" IS NOT NULL AND "captureRequestId" IS NOT NULL AND
    "merchantId" IS NOT NULL AND "environment" IS NOT NULL AND "environment" IN ('sandbox', 'live') AND
    "snapshot" IS NOT NULL AND jsonb_typeof("snapshot") = 'object' AND
    "snapshot" ? 'totalAmountCents' AND "snapshot" ? 'currency' AND
    "snapshot"->>'totalAmountCents' = "amountCents"::text AND "snapshot"->>'currency' = "currency"
  )
) IS TRUE) NOT VALID;

-- Enforce immutability even if a later application endpoint accidentally mass-assigns fields.
CREATE FUNCTION protect_paypal_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD."provider" = 'PAYPAL' AND (
    NEW."id" IS DISTINCT FROM OLD."id" OR
    NEW."provider" IS DISTINCT FROM OLD."provider" OR
    NEW."registrationId" IS DISTINCT FROM OLD."registrationId" OR
    NEW."amountCents" IS DISTINCT FROM OLD."amountCents" OR
    NEW."currency" IS DISTINCT FROM OLD."currency" OR
    NEW."merchantId" IS DISTINCT FROM OLD."merchantId" OR
    NEW."environment" IS DISTINCT FROM OLD."environment" OR
    NEW."snapshot" IS DISTINCT FROM OLD."snapshot" OR
    NEW."createRequestId" IS DISTINCT FROM OLD."createRequestId" OR
    NEW."captureRequestId" IS DISTINCT FROM OLD."captureRequestId" OR
    (OLD."paypalOrderId" IS NOT NULL AND NEW."paypalOrderId" IS DISTINCT FROM OLD."paypalOrderId") OR
    (OLD."paypalCaptureId" IS NOT NULL AND NEW."paypalCaptureId" IS DISTINCT FROM OLD."paypalCaptureId")
  ) THEN RAISE EXCEPTION 'PayPal payment identity and snapshot are immutable'; END IF;
  RETURN NEW;

















































































































































































  
END;
$$;
CREATE TRIGGER "Payment_protect_paypal_identity" BEFORE UPDATE ON "Payment"
FOR EACH ROW EXECUTE FUNCTION protect_paypal_identity();

-- Separate foreign keys alone do not ensure a linked PayPal invoice belongs
-- to the same registration or has the payment's immutable price.
CREATE FUNCTION protect_paypal_invoice_relation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."paymentId" IS NOT NULL AND EXISTS (
    SELECT 1 FROM "Payment" p WHERE p."id" = NEW."paymentId" AND p."provider" = 'PAYPAL'
      AND (p."registrationId" IS DISTINCT FROM NEW."registrationId"
        OR p."amountCents" IS DISTINCT FROM NEW."amountCents"
        OR p."currency" IS DISTINCT FROM NEW."currency")
  ) THEN RAISE EXCEPTION 'PayPal invoice must match its payment and registration'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "Invoice_protect_paypal_relation"
BEFORE INSERT OR UPDATE OF "paymentId", "registrationId", "amountCents", "currency" ON "Invoice"
FOR EACH ROW EXECUTE FUNCTION protect_paypal_invoice_relation();
COMMIT;
