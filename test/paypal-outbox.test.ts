// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const { db, send, smtpSend, smtpReady } = vi.hoisted(() => ({
  db: {
    payment: { findMany: vi.fn(), findUniqueOrThrow: vi.fn(), updateMany: vi.fn() },
    paymentOutbox: { findMany: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
    requestBucket: { deleteMany: vi.fn() }
  },
  send: vi.fn(),
  smtpSend: vi.fn(),
  smtpReady: vi.fn()
}));
vi.mock("@/lib/prisma/client", () => ({ prisma: db }));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  }
}));
vi.mock("@/lib/paypal/service", () => ({ reconcile: vi.fn(), commitState: vi.fn() }));
vi.mock("@/lib/email/smtp", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/email/smtp")>();
  return { ...actual, sendSmtpEmail: smtpSend, smtpConfigured: smtpReady };
});
import { SmtpDeliveryError } from "../lib/email/smtp";
import { maintainPayments } from "../lib/paypal/maintenance";
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("EMAIL_PROVIDER", "resend");
  smtpReady.mockReturnValue(true);
  smtpSend.mockResolvedValue(undefined);
  for (const [key, value] of Object.entries({
    PAYPAL_ENV: "sandbox",
    PAYPAL_ENABLED: "false",
    PAYPAL_CLIENT_ID: "test-client",
    PAYPAL_CLIENT_SECRET: "test-secret",
    PAYPAL_MERCHANT_ID: "MERCHANT12345",
    PAYPAL_WEBHOOK_ID: "webhook",
    PUBLIC_APP_ORIGIN: "https://conference.test",
    PAYPAL_RECONCILIATION_ENABLED: "true"
  }))
    vi.stubEnv(key, value);
  vi.stubEnv("RESEND_API_KEY", "test");
  vi.stubEnv("PAYMENT_EMAIL_FROM", "Conference <receipts@example.test>");
  db.payment.findMany.mockResolvedValue([]);
  db.paymentOutbox.findMany.mockResolvedValue([
    { id: "job", paymentId: "payment", attempts: 0, firstAttemptAt: null }
  ]);
  db.paymentOutbox.updateMany.mockResolvedValue({ count: 1 });
  db.payment.findUniqueOrThrow.mockResolvedValue({
    id: "payment",
    status: "PAID",
    paypalCaptureId: "CAPTURE12345",
    paidAt: new Date("2026-11-19T12:00:00Z"),
    amountCents: 39900,
    currency: "EUR",
    registration: {
      fullName: "Test Participant",
      conference: { name: "ICGIT 2026" },
      email: "guest@example.test",
      referenceNumber: "HNS-test",
      status: "CONFIRMED"
    }
  });
  send.mockResolvedValue({ data: { id: "email" }, error: null });
});
describe("payment receipt outbox", () => {
  it("does not send confirmation after registration cancellation", async () => {
    db.payment.findUniqueOrThrow.mockResolvedValue({
      id: "payment",
      status: "PAID",
      registration: { email: "guest@example.test", status: "CANCELLED" }
    });
    const result = await maintainPayments();
    expect(send).not.toHaveBeenCalled();
    expect(result.errors).toBe(1);
  });
  it("fails closed before maintenance work when reconciliation is paused", async () => {
    vi.stubEnv("PAYPAL_RECONCILIATION_ENABLED", "false");
    await expect(maintainPayments()).rejects.toThrow("Payment processing is paused;");
    expect(db.payment.findMany).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });
  it("uses a stable provider idempotency key and marks delivery after provider success", async () => {
    const result = await maintainPayments();
    expect(result.sent).toBe(1);
    expect(send.mock.calls[0][1]).toEqual({
      idempotencyKey: "payment-confirmed-payment"
    });
    expect(db.paymentOutbox.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ sentAt: expect.any(Date) })
      })
    );
  });
  it("sends the verified amount and reference to the registration email with a Sandbox label", async () => {
    await maintainPayments();
    expect(send.mock.calls[0][0]).toMatchObject({
      from: "Conference <receipts@example.test>",
      to: "guest@example.test",
      subject: "[SANDBOX TEST] Payment successful - ICGIT 2026"
    });
    expect(send.mock.calls[0][0].text).toContain("399.00 EUR");
    expect(send.mock.calls[0][0].text).toContain("HNS-test");
    expect(send.mock.calls[0][0].text).toContain("CAPTURE12345");
    expect(send.mock.calls[0][0].text).toContain("No real money was charged");
  });
  it.each(["PENDING", "PROCESSING", "FAILED", "PARTIALLY_REFUNDED", "REFUNDED"])(
    "does not send a success email for %s",
    async (status) => {
      const payment = await db.payment.findUniqueOrThrow();
      db.payment.findUniqueOrThrow.mockResolvedValue({ ...payment, status });
      await maintainPayments();
      expect(send).not.toHaveBeenCalled();
    }
  );
  it("does not send success for a paid record without verified capture identity", async () => {
    const payment = await db.payment.findUniqueOrThrow();
    db.payment.findUniqueOrThrow.mockResolvedValue({ ...payment, paypalCaptureId: null });
    await maintainPayments();
    expect(send).not.toHaveBeenCalled();
  });
  it("provider rejection schedules a retry without corrupting payment status", async () => {
    send.mockResolvedValue({ error: { message: "offline" } });
    const result = await maintainPayments();
    expect(result.errors).toBe(1);
    expect(db.paymentOutbox.update).not.toHaveBeenCalled();
    expect(db.payment.updateMany).not.toHaveBeenCalled();
    expect(db.paymentOutbox.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ availableAt: expect.any(Date) })
      })
    );
  });
  it("an overlapping worker cannot send without a lease", async () => {
    db.paymentOutbox.updateMany.mockResolvedValue({ count: 0 });
    await maintainPayments();
    expect(send).not.toHaveBeenCalled();
  });
  it("does not retry ambiguous sends beyond provider idempotency retention", async () => {
    db.paymentOutbox.findMany.mockResolvedValue([
      {
        id: "job",
        paymentId: "payment",
        attempts: 1,
        firstAttemptAt: new Date(Date.now() - 24 * 3600_000)
      }
    ]);
    await maintainPayments();
    expect(send).not.toHaveBeenCalled();
  });
});

describe("SMTP payment outbox", () => {
  beforeEach(() => vi.stubEnv("EMAIL_PROVIDER", "smtp"));
  it("sends through SMTP to the registered email without calling Resend", async () => {
    const result = await maintainPayments();
    expect(result.sent).toBe(1);
    expect(send).not.toHaveBeenCalled();
    expect(smtpSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "guest@example.test",
        subject: expect.stringContaining("Payment successful")
      }),
      "payment-confirmed-payment"
    );
  });
  it("keeps queued receipts untouched while SMTP settings are incomplete", async () => {
    smtpReady.mockReturnValue(false);
    await maintainPayments();
    expect(db.paymentOutbox.findMany).not.toHaveBeenCalled();
    expect(smtpSend).not.toHaveBeenCalled();
  });
  it("does not resend an expired in-flight attempt whose delivery is uncertain", async () => {
    db.paymentOutbox.findMany.mockResolvedValue([
      {
        id: "job",
        paymentId: "payment",
        attempts: 1,
        firstAttemptAt: new Date(Date.now() - 120000)
      }
    ]);
    await maintainPayments();
    expect(smtpSend).not.toHaveBeenCalled();
    expect(db.paymentOutbox.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { attempts: 8 } })
    );
  });
  it("retries only when the SMTP failure is known to be before acceptance", async () => {
    smtpSend.mockRejectedValue(new SmtpDeliveryError(true));
    await maintainPayments();
    expect(db.paymentOutbox.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ firstAttemptAt: null, leaseUntil: null })
      })
    );
  });
  it("requires manual review for an ambiguous SMTP timeout", async () => {
    smtpSend.mockRejectedValue(new SmtpDeliveryError(false));
    await maintainPayments();
    expect(db.paymentOutbox.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ attempts: 8, leaseUntil: null })
      })
    );
  });
  it("does not resend if SMTP accepted but recording sentAt failed", async () => {
    db.paymentOutbox.update.mockRejectedValue(new Error("Database unavailable"));
    await maintainPayments();
    expect(smtpSend).toHaveBeenCalledOnce();
    expect(db.paymentOutbox.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ attempts: 8 }) })
    );
  });
});
