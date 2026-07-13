import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/logging/logger";
import type { PaymentStatus } from "@prisma/client";

export interface ChargeRequest {
  registrationId: string;
  provider: "STRIPE" | "RAZORPAY" | "BANK_TRANSFER";
  amountCents: number;
  providerRef?: string;
}

export interface RefundRequest {
  paymentId: string;
  reason?: string;
}

export class PaymentService {
  async charge(request: ChargeRequest) {
    logger.info("Initializing payment charge request", {
      metadata: { registrationId: request.registrationId, provider: request.provider }
    });

    // Mock processing logic based on provider choice
    let transactionStatus: PaymentStatus = "PENDING";
    const referenceId = request.providerRef ?? `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    if (request.provider === "STRIPE") {
      // Mock Stripe success response
      transactionStatus = "PAID";
    } else if (request.provider === "RAZORPAY") {
      // Mock Razorpay success response
      transactionStatus = "PAID";
    } else if (request.provider === "BANK_TRANSFER") {
      // Bank transfers remain pending until manual validation
      transactionStatus = "PENDING";
    }

    // Save payment record to postgres database
    return prisma.payment.create({
      data: {
        registrationId: request.registrationId,
        provider: request.provider,
        providerRef: referenceId,
        amountCents: request.amountCents,
        status: transactionStatus,
        paidAt: transactionStatus === "PAID" ? new Date() : null
      }
    });
  }

  async refund(request: RefundRequest) {
    logger.info("Initializing refund process", {
      metadata: { paymentId: request.paymentId }
    });

    return prisma.payment.update({
      where: { id: request.paymentId },
      data: {
        status: "FAILED" // Marks payment failed/refunded in local schema enum status
      }
    });
  }
}

export const paymentService = new PaymentService();
