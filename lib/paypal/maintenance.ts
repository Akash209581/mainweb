import { sendSmtpEmail, smtpConfigured, SmtpDeliveryError } from "@/lib/email/smtp";
import { logger } from "@/lib/logging/logger";
import { paymentConfirmationEmail } from "@/lib/payments/confirmation-email";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma/client";
import { commitState, reconcile } from "./service";
import { paypalConfig } from "./config";

/** Run once a minute from a singleton scheduler. Database leases also protect overlapping workers. */
export async function maintainPayments() {
  const config = paypalConfig("reconcile");
  let reconciled = 0,
    errors = 0,
    sent = 0;
  const payments = await prisma.payment.findMany({
    where: {
      provider: "PAYPAL",
      environment: config.PAYPAL_ENV,
      merchantId: config.PAYPAL_MERCHANT_ID,
      paypalOrderId: { not: null },
      deletedAt: null,
      status: { notIn: ["REFUNDED", "REVERSED", "CANCELLED"] },
      OR: [
        { lastReconciledAt: null },
        { lastReconciledAt: { lt: new Date(Date.now() - 60_000) } }
      ]
    },
    orderBy: { lastReconciledAt: { sort: "asc", nulls: "first" } },
    take: 20
  });
  for (const payment of payments) {
    try {
      const result = await reconcile(payment);
      await commitState(payment, result.state, result.captureId);
      reconciled++;
    } catch {
      errors++;
      await prisma.payment.updateMany({
        where: { id: payment.id },
        data: { lastReconciledAt: new Date() }
      });
    }
  }
  const smtp = process.env.EMAIL_PROVIDER === "smtp";
  if (
    (smtp ? smtpConfigured() : !!process.env.RESEND_API_KEY) &&
    process.env.PAYMENT_EMAIL_FROM
  ) {
    const resend = smtp ? undefined : new Resend(process.env.RESEND_API_KEY!);
    const jobs = await prisma.paymentOutbox.findMany({
      where: {
        sentAt: null,
        payment: {
          provider: "PAYPAL",
          environment: config.PAYPAL_ENV,
          merchantId: config.PAYPAL_MERCHANT_ID
        },
        attempts: { lt: 8 },
        availableAt: { lte: new Date() },
        OR: [{ leaseUntil: null }, { leaseUntil: { lt: new Date() } }]
      },
      take: 20
    });
    for (const job of jobs) {
      // SMTP has no provider idempotency. An expired in-flight attempt may have
      // been accepted already; never automatically resend it after a crash.
      if (smtp && job.firstAttemptAt) {
        await prisma.paymentOutbox.updateMany({
          where: {
            id: job.id,
            sentAt: null,
            attempts: job.attempts,
            OR: [{ leaseUntil: null }, { leaseUntil: { lt: new Date() } }]
          },
          data: { attempts: 8 }
        });
        logger.error("SMTP delivery requires manual review", {
          metadata: { jobId: job.id }
        });
        errors++;
        continue;
      }
      // Resend retains idempotency keys for 24h. Older ambiguous sends need manual review.
      if (
        !smtp &&
        job.firstAttemptAt &&
        Date.now() - job.firstAttemptAt.getTime() > 23 * 3600_000
      ) {
        errors++;
        continue;
      }
      const lease = await prisma.paymentOutbox.updateMany({
        where: {
          id: job.id,
          sentAt: null,
          attempts: job.attempts,
          OR: [{ leaseUntil: null }, { leaseUntil: { lt: new Date() } }]
        },
        data: {
          leaseUntil: new Date(Date.now() + 60_000),
          attempts: { increment: 1 },
          firstAttemptAt: job.firstAttemptAt || new Date()
        }
      });
      if (!lease.count) continue;
      let deliveryStarted = false;
      try {
        const payment = await prisma.payment.findUniqueOrThrow({
          where: { id: job.paymentId },
          include: {
            registration: { include: { conference: { select: { name: true } } } }
          }
        });
        if (
          payment.status !== "PAID" ||
          payment.registration.status !== "CONFIRMED" ||
          !payment.paypalCaptureId ||
          !payment.paidAt
        ) {
          errors++;
          await prisma.paymentOutbox.updateMany({
            where: { id: job.id, sentAt: null },
            data: {
              leaseUntil: null,
              availableAt: new Date(Date.now() + 3600_000),
              ...(smtp ? { firstAttemptAt: null } : {})
            }
          });
          continue;
        }
        const message = {
          from: process.env.PAYMENT_EMAIL_FROM,
          to: payment.registration.email,
          ...paymentConfirmationEmail({
            name: payment.registration.fullName,
            conferenceName: payment.registration.conference.name,
            referenceNumber: payment.registration.referenceNumber!,
            amountCents: payment.amountCents,
            currency: payment.currency,
            captureId: payment.paypalCaptureId,
            paidAt: payment.paidAt,
            sandbox: config.PAYPAL_ENV === "sandbox"
          })
        };
        deliveryStarted = true;
        if (smtp) {
          await sendSmtpEmail(message, "payment-confirmed-" + payment.id);
        } else {
          const result = await resend!.emails.send(message, {
            idempotencyKey: "payment-confirmed-" + payment.id
          });
          if (result.error) throw new Error("Email provider rejected send");
        }
        await prisma.paymentOutbox.update({
          where: { id: job.id },
          data: { sentAt: new Date(), leaseUntil: null }
        });
        sent++;
      } catch (error) {
        errors++;
        const retrySafe =
          !smtp ||
          !deliveryStarted ||
          (error instanceof SmtpDeliveryError && error.safeToRetry);
        if (!retrySafe)
          logger.error("SMTP delivery uncertain; manual review required", {
            metadata: { jobId: job.id }
          });
        await prisma.paymentOutbox.updateMany({
          where: { id: job.id, sentAt: null },
          data: {
            ...(smtp ? (retrySafe ? { firstAttemptAt: null } : { attempts: 8 }) : {}),
            availableAt: new Date(
              Date.now() + Math.min(3600_000, 60_000 * 2 ** job.attempts)
            ),
            leaseUntil: null
          }
        });
      }
    }
  }
  await prisma.requestBucket.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  return { reconciled, sent, errors };
}
