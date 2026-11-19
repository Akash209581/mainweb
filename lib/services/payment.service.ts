import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/logging/logger";
import { randomUUID } from "crypto";

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
    if (request.provider !== "BANK_TRANSFER") throw new Error("Mock card payment processing is disabled. Use the verified payment integration.");
    logger.info("Initializing payment charge request", {
      metadata: { registrationId: request.registrationId, provider: request.provider }
    });

    const referenceId = request.providerRef ?? `TXN-${randomUUID()}`;

    // Save payment record to postgres database
    return prisma.payment.create({
      data: {
        registrationId: request.registrationId,
        provider: request.provider,
        providerRef: referenceId,
        amountCents: request.amountCents,
        status: "PENDING",
        paidAt: null
      }
    });
  }

  async refund(_request: RefundRequest): Promise<never> {
    throw new Error("Refunds require verified provider processing and reconciliation.");
  }
}

export const paymentService = new PaymentService();
