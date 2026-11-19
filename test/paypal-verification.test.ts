// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { Payment } from "@prisma/client";
import {
  decimalAmount,
  mayTransition,
  minorUnits,
  orderCaptures,
  verifyCapture,
  verifyInternationalPayer,
  verifyOrder
} from "../lib/paypal/verification";

const payment = {
  id: "payment-1",
  registrationId: "registration-1",
  paypalOrderId: "ORDER12345678",
  paypalCaptureId: null,
  amountCents: 32123,
  currency: "EUR",
  merchantId: "MERCHANT12345"
} as Payment;
function order() {
  return {
    id: payment.paypalOrderId,
    intent: "CAPTURE",
    status: "APPROVED",
    purchase_units: [
      {
        reference_id: payment.registrationId,
        custom_id: payment.id,
        invoice_id: payment.id,
        payee: { merchant_id: payment.merchantId },
        amount: { currency_code: "EUR", value: "321.23" },
        payments: { captures: [{ id: "CAPTURE12345" }] }
      }
    ]
  };
}
function capture() {
  return {
    id: "CAPTURE12345",
    status: "COMPLETED",
    amount: { currency_code: "EUR", value: "321.23" }
  };
}
describe("PayPal trust boundary", () => {
  it("verifies exact order/capture identity and minor units", () => {
    const unit = verifyOrder(order(), payment);
    expect(verifyCapture(capture(), payment, unit).state).toBe("PAID");
    expect(minorUnits("321.23")).toBe(32123);
    expect(decimalAmount(32123)).toBe("321.23");
  });
  for (const value of ["1e2", "-1.00", "1.001", "1", "01.00", "99999999.99", 321.23])
    it(`rejects malformed money ${value}`, () =>
      expect(() => minorUnits(value)).toThrow());
  for (const field of ["id", "intent"] as const)
    it(`rejects substituted order ${field}`, () => {
      const data = order();
      data[field] = "SUBSTITUTED";
      expect(() => verifyOrder(data, payment)).toThrow();
    });
  it("rejects amount manipulation", () => {
    const data = order();
    data.purchase_units[0].amount.value = "0.01";
    expect(() => verifyOrder(data, payment)).toThrow();
  });
  it("rejects currency manipulation", () => {
    const data = order();
    data.purchase_units[0].amount.currency_code = "USD";
    expect(() => verifyOrder(data, payment)).toThrow();
  });
  it("rejects another registration or payment", () => {
    const data = order();
    data.purchase_units[0].custom_id = "other";
    expect(() => verifyOrder(data, payment)).toThrow();
  });
  it("rejects another merchant", () => {
    const data = order();
    data.purchase_units[0].payee.merchant_id = "WRONGMERCHANT";
    expect(() => verifyOrder(data, payment)).toThrow();
  });
  it("rejects substituted captures", () =>
    expect(() =>
      verifyCapture(
        { ...capture(), id: "OTHERCAPTURE" },
        payment,
        verifyOrder(order(), payment)
      )
    ).toThrow());
  it("rejects capture amount/currency mismatch", () =>
    expect(() =>
      verifyCapture(
        { ...capture(), amount: { value: "1.00", currency_code: "USD" } },
        payment,
        verifyOrder(order(), payment)
      )
    ).toThrow());
  it("rejects capture/order relationship mismatch", () =>
    expect(() =>
      verifyCapture(
        { ...capture(), supplementary_data: { related_ids: { order_id: "OTHERORDER" } } },
        payment,
        verifyOrder(order(), payment)
      )
    ).toThrow());
  it("rejects multiple captures", () =>
    expect(() => orderCaptures({ payments: { captures: [{}, {}] } })).toThrow());
  for (const [status, state] of [
    ["PENDING", "PROCESSING"],
    ["DECLINED", "FAILED"],
    ["REFUNDED", "REFUNDED"],
    ["PARTIALLY_REFUNDED", "PARTIALLY_REFUNDED"]
  ])
    it(`handles ${status}`, () =>
      expect(
        verifyCapture({ ...capture(), status }, payment, verifyOrder(order(), payment))
          .state
      ).toBe(state));
  for (const from of ["PAID", "REFUNDED", "REVERSED", "PARTIALLY_REFUNDED", "CANCELLED"])
    it(`prevents stale pending/completed events from reverting ${from}`, () => {
      expect(mayTransition(from, "PENDING")).toBe(false);
      if (from !== "PAID") expect(mayTransition(from, "PAID")).toBe(false);
    });
  it("allows verified refund/reversal transitions", () => {
    expect(mayTransition("PAID", "REFUNDED")).toBe(true);
    expect(mayTransition("PAID", "REVERSED")).toBe(true);
  });
  it("requires provider evidence of an international payer", () => {
    expect(() =>
      verifyInternationalPayer({ payer: { address: { country_code: "IN" } } })
    ).toThrow();
    expect(() => verifyInternationalPayer({})).toThrow();
    expect(() =>
      verifyInternationalPayer({
        payment_source: { paypal: { address: { country_code: "US" } } }
      })
    ).not.toThrow();
  });
});
