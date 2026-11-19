import type { Payment } from "@prisma/client";
import { PaymentError } from "./config";
import type { JsonObject } from "./provider";

export function object(value: unknown): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new PaymentError("Payment verification failed.");
  return value as JsonObject;
}
export function minorUnits(value: unknown): number {
  if (typeof value !== "string" || !/^(0|[1-9]\d{0,7})\.\d{2}$/.test(value))
    throw new PaymentError("Invalid payment amount.");
  const [major, minor] = value.split(".");
  const amount = Number(major) * 100 + Number(minor);
  if (!Number.isSafeInteger(amount) || amount > 2147483647)
    throw new PaymentError("Invalid payment amount.");
  return amount;
}
export function decimalAmount(cents: number) {
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 2147483647)
    throw new PaymentError("Invalid payment amount.");
  return Math.floor(cents / 100) + "." + String(cents % 100).padStart(2, "0");
}
function verifyMoney(value: unknown, payment: Pick<Payment, "amountCents" | "currency">) {
  const amount = object(value);
  if (
    amount.currency_code !== payment.currency ||
    minorUnits(amount.value) !== payment.amountCents
  )
    throw new PaymentError("Payment amount or currency mismatch.");
}
export function verifyOrder(
  order: JsonObject,
  payment: Payment,
  orderId = payment.paypalOrderId
) {
  if (
    order.id !== orderId ||
    order.intent !== "CAPTURE" ||
    !["CREATED", "APPROVED", "COMPLETED", "VOIDED", "PAYER_ACTION_REQUIRED"].includes(
      String(order.status)
    )
  )
    throw new PaymentError("Payment order mismatch.");
  if (!Array.isArray(order.purchase_units) || order.purchase_units.length !== 1)
    throw new PaymentError("Payment order mismatch.");
  const unit = object(order.purchase_units[0]);
  if (
    unit.custom_id !== payment.id ||
    unit.reference_id !== payment.registrationId ||
    unit.invoice_id !== payment.id ||
    object(unit.payee).merchant_id !== payment.merchantId
  )
    throw new PaymentError("Payment ownership or merchant mismatch.");
  verifyMoney(unit.amount, payment);
  return unit;
}
export function verifyInternationalPayer(order: JsonObject) {
  const paypal = order.payment_source
    ? object(object(order.payment_source).paypal)
    : order.payer
      ? object(order.payer)
      : undefined;
  const country = paypal?.address ? object(paypal.address).country_code : undefined;
  if (typeof country !== "string" || !/^[A-Z]{2}$/.test(country) || country === "IN")
    throw new PaymentError("An eligible international PayPal payer is required.", 403);
}
export function orderCaptures(unit: JsonObject): JsonObject[] {
  if (!unit.payments) return [];
  const captures = object(unit.payments).captures;
  if (captures === undefined) return [];
  if (!Array.isArray(captures) || captures.length !== 1)
    throw new PaymentError("Unexpected capture count.");
  return captures.map(object);
}
export function verifyCapture(capture: JsonObject, payment: Payment, unit: JsonObject) {
  if (
    typeof capture.id !== "string" ||
    !/^[A-Z0-9]{8,40}$/.test(capture.id) ||
    (payment.paypalCaptureId && capture.id !== payment.paypalCaptureId) ||
    !orderCaptures(unit).some((c) => c.id === capture.id)
  )
    throw new PaymentError("Payment capture mismatch.");
  verifyMoney(capture.amount, payment);
  if (capture.payee && object(capture.payee).merchant_id !== payment.merchantId)
    throw new PaymentError("Capture merchant mismatch.");
  if (capture.supplementary_data) {
    const ids = object(object(capture.supplementary_data).related_ids);
    if (ids.order_id && ids.order_id !== payment.paypalOrderId)
      throw new PaymentError("Capture order mismatch.");
  }
  const states = {
    COMPLETED: "PAID",
    PENDING: "PROCESSING",
    DECLINED: "FAILED",
    FAILED: "FAILED",
    REFUNDED: "REFUNDED",
    PARTIALLY_REFUNDED: "PARTIALLY_REFUNDED",
    REVERSED: "REVERSED"
  } as const;
  const state = states[capture.status as keyof typeof states];
  if (!state) throw new PaymentError("Unrecognized capture status.");
  return { state, captureId: capture.id };
}
export function mayTransition(from: string, to: string) {
  if (from === to) return true;
  if (["REFUNDED", "REVERSED", "CANCELLED"].includes(from)) return false;
  if (from === "PARTIALLY_REFUNDED") return ["REFUNDED", "REVERSED"].includes(to);
  if (from === "PAID") return ["PARTIALLY_REFUNDED", "REFUNDED", "REVERSED"].includes(to);
  // A previously declined/failed capture can only recover through authoritative provider evidence.
  return [
    "PENDING",
    "APPROVED",
    "PROCESSING",
    "PAID",
    "FAILED",
    "CANCELLED",
    "REFUNDED",
    "PARTIALLY_REFUNDED",
    "REVERSED"
  ].includes(to);
}
