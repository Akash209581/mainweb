import { randomUUID } from "crypto";
import { Prisma, type Payment, type PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
import { hashCapability } from "@/lib/security/checkout";
import { PaymentError, paypalConfig, type PaypalOperation } from "./config";
import { paypalRequest, type JsonObject } from "./provider";
import {
  decimalAmount,
  mayTransition,
  minorUnits,
  object,
  orderCaptures,
  verifyCapture,
  verifyInternationalPayer,
  verifyOrder
} from "./verification";

const provider = "PAYPAL";
function eventCaptureId(resource: JsonObject | undefined, eventType: string): unknown {
  const related = (resource?.supplementary_data as JsonObject | undefined)
    ?.related_ids as JsonObject | undefined;
  if (related?.capture_id) return related.capture_id;
  // Refund/reversal resources can have their own ID, distinct from the capture.
  if (Array.isArray(resource?.links)) {
    for (const link of resource.links) {
      const item = object(link);
      if (item.rel !== "up" || typeof item.href !== "string") continue;
      const match = item.href.match(
        /^https:\/\/api(?:-m)?\.(?:sandbox\.)?paypal\.com\/v2\/payments\/captures\/([A-Z0-9]{8,40})$/
      );
      if (match) return match[1];
    }
  }
  return eventType === "PAYMENT.CAPTURE.REFUNDED" ? undefined : resource?.id;
}
export async function ownedRegistration(registrationId: string, capability: string) {
  const registration = await prisma.registration.findFirst({
    where: {
      id: registrationId,
      guestCheckoutHash: hashCapability(capability),
      deletedAt: null,
      conference: { deletedAt: null }
    }
  });
  if (!registration) throw new PaymentError("Registration not found.", 404);
  return registration;
}
function sameEnvironment(payment: Payment, operation?: PaypalOperation) {
  const c = paypalConfig(operation);
  if (payment.environment !== c.PAYPAL_ENV || payment.merchantId !== c.PAYPAL_MERCHANT_ID)
    throw new PaymentError("Payment configuration has changed. Contact support.");
}
async function claim(payment: Payment) {
  const lease = new Date(Date.now() + 60_000);
  const result = await prisma.payment.updateMany({
    where: {
      id: payment.id,
      version: payment.version,
      OR: [{ operationUntil: null }, { operationUntil: { lt: new Date() } }]
    },
    data: { operationUntil: lease }
  });
  if (result.count !== 1)
    throw new PaymentError("Payment is being processed. Check status shortly.");
  return lease;
}
async function release(payment: Payment, lease: Date) {
  await prisma.payment.updateMany({
    where: { id: payment.id, operationUntil: lease },
    data: { operationUntil: null }
  });
}
export async function createOrder(registrationId: string, capability: string) {
  const c = paypalConfig("create");
  const r = await ownedRegistration(registrationId, capability);
  if (
    r.status !== "PENDING" ||
    r.isQuoteRequired ||
    r.totalAmountCents <= 0 ||
    !["EUR", "USD", "GBP"].includes(r.currency)
  )
    throw new PaymentError("This registration is not eligible for online checkout.");
  if (!r.countryName || /^(india|in)$/i.test(r.countryName.trim()))
    throw new PaymentError(
      "PayPal checkout is available only for eligible international customers.",
      403
    );
  let payment = await prisma.payment.findFirst({ where: { registrationId, provider } });
  if (!payment) {
    try {
      payment = await prisma.payment.create({
        data: {
          registrationId,
          provider,
          amountCents: r.totalAmountCents,
          currency: r.currency,
          createRequestId: randomUUID(),
          captureRequestId: randomUUID(),
          merchantId: c.PAYPAL_MERCHANT_ID,
          environment: c.PAYPAL_ENV,
          snapshot: {
            registrationFeeCents: r.registrationFeeCents,
            accommodationFeeCents: r.accommodationFeeCents || 0,
            totalAmountCents: r.totalAmountCents,
            currency: r.currency,
            category: r.category,
            pricedAt: r.createdAt.toISOString()
          }
        }
      });
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2002"
      )
        throw error;
      payment = await prisma.payment.findFirst({ where: { registrationId, provider } });
      if (!payment) throw new PaymentError("Retry checkout shortly.", 503);
    }
  }
  sameEnvironment(payment);
  if (payment.paypalOrderId) return { orderId: payment.paypalOrderId };
  // PayPal's default idempotency retention is six hours; never risk creating another order afterward.
  if (Date.now() - payment.createdAt.getTime() > 5 * 3600_000 || !payment.createRequestId)
    throw new PaymentError("Checkout requires reconciliation by conference support.");
  const lease = await claim(payment);
  try {
    const order = await paypalRequest(
      "/v2/checkout/orders",
      "POST",
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: registrationId,
            custom_id: payment.id,
            invoice_id: payment.id,
            payee: { merchant_id: payment.merchantId },
            amount: {
              currency_code: payment.currency,
              value: decimalAmount(payment.amountCents)
            }
          }
        ],
        payment_source: {
          paypal: {
            experience_context: {
              shipping_preference: "NO_SHIPPING",
              user_action: "PAY_NOW"
            }
          }
        }
      },
      payment.createRequestId
    );
    if (typeof order.id !== "string" || !/^[A-Z0-9]{8,40}$/.test(order.id))
      throw new PaymentError("Invalid PayPal order.", 503);
    verifyOrder(order, payment, order.id);
    const saved = await prisma.payment.updateMany({
      where: { id: payment.id, operationUntil: lease },
      data: { paypalOrderId: order.id, providerRef: order.id, operationUntil: null }
    });
    if (saved.count !== 1)
      throw new PaymentError("Order creation is awaiting reconciliation.", 503);
    return { orderId: order.id };
  } finally {
    await release(payment, lease);
  }
}
export async function reconcile(
  payment: Payment,
  context: PaypalOperation = "reconcile"
) {
  sameEnvironment(payment, context);
  if (!payment.paypalOrderId)
    throw new PaymentError("Order creation is awaiting reconciliation.");
  const order = await paypalRequest(
    "/v2/checkout/orders/" + payment.paypalOrderId,
    "GET",
    undefined,
    undefined,
    context
  );
  const unit = verifyOrder(order, payment);
  const captures = orderCaptures(unit);
  if (!captures.length)
    return {
      order,
      unit,
      state:
        order.status === "VOIDED"
          ? ("CANCELLED" as const)
          : order.status === "APPROVED"
            ? ("APPROVED" as const)
            : ("PENDING" as const),
      captureId: undefined
    };
  // The capture endpoint is authoritative for later refund/reversal state.
  const capture = await paypalRequest(
    "/v2/payments/captures/" + String(captures[0].id),
    "GET",
    undefined,
    undefined,
    context
  );
  return { order, unit, ...verifyCapture(capture, payment, unit) };
}
export async function commitState(
  payment: Payment,
  state: PaymentStatus,
  captureId?: string,
  event?: { id: string; type: string }
) {
  await prisma.$transaction(async (tx) => {
    if (event && (await tx.paymentWebhook.findUnique({ where: { id: event.id } })))
      return;
    const current = await tx.payment.findUniqueOrThrow({ where: { id: payment.id } });
    if (current.version !== payment.version)
      throw new PaymentError("Payment changed. Reconcile again.", 503);
    if (current.paypalCaptureId && captureId && current.paypalCaptureId !== captureId)
      throw new PaymentError("Capture mismatch.");
    const allowed = mayTransition(current.status, state);
    if (
      (allowed && current.status !== state) ||
      (allowed && captureId && !current.paypalCaptureId)
    ) {
      if (
        ["PAID", "PARTIALLY_REFUNDED", "REFUNDED", "REVERSED"].includes(state) &&
        !captureId
      )
        throw new PaymentError("Verified capture required.");
      const changed = await tx.payment.updateMany({
        where: { id: current.id, version: current.version },
        data: {
          status: state,
          ...(captureId ? { paypalCaptureId: captureId } : {}),
          paidAt: state === "PAID" ? current.paidAt || new Date() : current.paidAt,
          version: { increment: 1 },
          ...(captureId || state === "CANCELLED" ? { operationUntil: null } : {})
        }
      });
      if (changed.count !== 1)
        throw new PaymentError("Payment changed. Reconcile again.", 503);
      if (state === "PAID") {
        const confirmed = await tx.registration.updateMany({
          where: { id: current.registrationId, status: "PENDING", deletedAt: null },
          data: { status: "CONFIRMED" }
        });
        if (!confirmed.count)
          throw new PaymentError("Registration requires manual reconciliation.", 503);
        await tx.paymentOutbox.upsert({
          where: { paymentId: current.id },
          create: { paymentId: current.id },
          update: {}
        });
        await tx.invoice.updateMany({
          where: {
            registrationId: current.registrationId,
            paymentId: null,
            amountCents: current.amountCents,
            currency: current.currency
          },
          data: { paymentId: current.id }
        });
      }
      if (["REFUNDED", "REVERSED"].includes(state))
        await tx.registration.updateMany({
          where: { id: current.registrationId, status: { in: ["PENDING", "CONFIRMED"] } },
          data: { status: "CANCELLED" }
        });
      await tx.auditLog.create({
        data: {
          action: "payment." + state.toLowerCase(),
          entity: "Payment",
          entityId: current.id,
          metadata: {
            from: current.status,
            to: state,
            ...(event ? { eventId: event.id } : {})
          }
        }
      });
    }
    await tx.payment.updateMany({
      where: { id: current.id },
      data: { lastReconciledAt: new Date() }
    });
    if (event)
      await tx.paymentWebhook.create({
        data: { id: event.id, eventType: event.type, paymentId: current.id }
      });
  });
}
export async function captureOrder(registrationId: string, capability: string) {
  paypalConfig("capture");
  await ownedRegistration(registrationId, capability);
  let payment = await prisma.payment.findFirst({
    where: { registrationId, provider, deletedAt: null }
  });
  if (!payment?.paypalOrderId) throw new PaymentError("Payment order not found.", 404);
  let verified = await reconcile(payment, "capture");
  if (
    verified.captureId ||
    ["CANCELLED", "REFUNDED", "REVERSED"].includes(payment.status)
  ) {
    await commitState(payment, verified.state, verified.captureId);
    return paymentView(
      await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } })
    );
  }
  const r = await ownedRegistration(registrationId, capability);
  if (
    r.status !== "PENDING" ||
    verified.order.status !== "APPROVED" ||
    !payment.captureRequestId
  )
    throw new PaymentError("Payment is not ready for capture.");
  verifyInternationalPayer(verified.order);
  if (
    payment.captureStartedAt &&
    Date.now() - payment.captureStartedAt.getTime() > 5 * 3600_000
  )
    throw new PaymentError("Capture requires reconciliation by conference support.");
  const lease = await claim(payment);
  try {
    await prisma.payment.updateMany({
      where: { id: payment.id, operationUntil: lease, captureStartedAt: null },
      data: { captureStartedAt: new Date() }
    });
    const captured = await paypalRequest(
      "/v2/checkout/orders/" + payment.paypalOrderId + "/capture",
      "POST",
      {},
      payment.captureRequestId
    );
    const unit = verifyOrder(captured, payment);
    const captures = orderCaptures(unit);
    if (captures.length !== 1)
      throw new PaymentError("Capture awaiting reconciliation.", 503);
    verifyCapture(captures[0], payment, unit);
    // Never confirm solely from a browser callback or an unverified provider response.
    payment = await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
    verified = await reconcile(payment, "capture");
    await commitState(payment, verified.state, verified.captureId);
    return paymentView(
      await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } })
    );
  } finally {
    await release(payment, lease);
  }
}
export function paymentView(payment: Payment) {
  return {
    status: payment.status,
    amountCents: payment.amountCents,
    currency: payment.currency
  };
}
export async function statusPayment(registrationId: string, capability: string) {
  await ownedRegistration(registrationId, capability);
  const payment = await prisma.payment.findFirst({
    where: { registrationId, provider, deletedAt: null }
  });
  if (!payment) return { status: "PENDING" };
  if (payment.paypalOrderId && paypalConfig().PAYPAL_RECONCILIATION_ENABLED === "true") {
    const result = await reconcile(payment);
    await commitState(payment, result.state, result.captureId);
  }
  return paymentView(
    await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } })
  );
}
export async function webhook(event: JsonObject, headers: Headers) {
  const c = paypalConfig("webhook");
  const names = [
    "paypal-auth-algo",
    "paypal-cert-url",
    "paypal-transmission-id",
    "paypal-transmission-sig",
    "paypal-transmission-time"
  ];
  if (names.some((n) => !headers.get(n) || headers.get(n)!.length > 2048))
    throw new PaymentError("Invalid webhook headers.", 400);
  if (
    !/^https:\/\/api(?:-m)?\.(?:sandbox\.)?paypal\.com\/v1\/notifications\/certs\/[A-Za-z0-9-]+$/.test(
      headers.get("paypal-cert-url")!
    )
  )
    throw new PaymentError("Invalid certificate URL.", 400);
  const verification = await paypalRequest(
    "/v1/notifications/verify-webhook-signature",
    "POST",
    {
      auth_algo: headers.get(names[0]),
      cert_url: headers.get(names[1]),
      transmission_id: headers.get(names[2]),
      transmission_sig: headers.get(names[3]),
      transmission_time: headers.get(names[4]),
      webhook_id: c.PAYPAL_WEBHOOK_ID,
      webhook_event: event
    }
  );
  if (verification.verification_status !== "SUCCESS")
    throw new PaymentError("Invalid webhook signature.", 400);
  if (
    typeof event.id !== "string" ||
    event.id.length > 200 ||
    typeof event.event_type !== "string"
  )
    throw new PaymentError("Invalid event.", 400);
  if (await prisma.paymentWebhook.findUnique({ where: { id: event.id } })) return;
  const relevant = [
    "CHECKOUT.ORDER.APPROVED",
    "CHECKOUT.ORDER.COMPLETED",
    "PAYMENT.CAPTURE.COMPLETED",
    "PAYMENT.CAPTURE.PENDING",
    "PAYMENT.CAPTURE.DENIED",
    "PAYMENT.CAPTURE.DECLINED",
    "PAYMENT.CAPTURE.REFUNDED",
    "PAYMENT.CAPTURE.REVERSED"
  ];
  if (!relevant.includes(event.event_type)) return;
  // Do not follow event-provided links or use its payment status as evidence.
  const resource = event.resource as JsonObject | undefined;
  const related = (resource?.supplementary_data as JsonObject | undefined)
    ?.related_ids as JsonObject | undefined;
  const orderId = event.event_type.startsWith("CHECKOUT.ORDER.")
    ? resource?.id
    : related?.order_id;
  const captureId = eventCaptureId(resource, event.event_type);
  const payment = await prisma.payment.findFirst({
    where: {
      provider,
      OR: [
        ...(typeof orderId === "string" ? [{ paypalOrderId: orderId }] : []),
        ...(typeof captureId === "string" ? [{ paypalCaptureId: captureId }] : [])
      ]
    }
  });
  // Race with create-order persistence: retain PayPal retries rather than lose a relevant event.
  if (!payment)
    throw new PaymentError("Payment is not yet available for reconciliation.", 503);
  const result = await reconcile(payment, "webhook");
  if (
    event.event_type.startsWith("PAYMENT.CAPTURE.") &&
    (!captureId || !result.captureId || captureId !== result.captureId)
  )
    throw new PaymentError(
      "Capture event is awaiting authoritative reconciliation.",
      503
    );
  if (event.event_type === "PAYMENT.CAPTURE.REVERSED") {
    // Capture REST status does not enumerate REVERSED. Fetch the event independently
    // with merchant credentials, then bind its capture/order/money to our verified order.
    const authoritative = await paypalRequest(
      "/v1/notifications/webhooks-events/" + event.id
    );
    if (authoritative.id !== event.id || authoritative.event_type !== event.event_type)
      throw new PaymentError("Reversal verification failed.");
    const reversal = object(authoritative.resource);
    if (eventCaptureId(reversal, event.event_type) !== result.captureId)
      throw new PaymentError("Reversal capture mismatch.");
    const money = object(reversal.amount);
    if (
      money.currency_code !== payment.currency ||
      minorUnits(money.value) <= 0 ||
      minorUnits(money.value) > payment.amountCents
    )
      throw new PaymentError("Reversal amount mismatch.");
    // Any confirmed reversal suspends confirmation pending finance review, including partial reversals.
    result.state = "REVERSED";
  }
  await commitState(payment, result.state, result.captureId, {
    id: event.id,
    type: event.event_type
  });
}
