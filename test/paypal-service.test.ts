// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Payment, Prisma, Registration } from "@prisma/client";
const { db, provider } = vi.hoisted(() => ({
  db: {
    registration: { findFirst: vi.fn(), updateMany: vi.fn() },
    payment: {
      findFirst: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn()
    },
    paymentWebhook: { findUnique: vi.fn(), create: vi.fn() },
    paymentOutbox: { upsert: vi.fn() },
    invoice: { updateMany: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn()
  },
  provider: vi.fn()
}));
vi.mock("@/lib/prisma/client", () => ({ prisma: db }));
vi.mock("@/lib/paypal/provider", () => ({ paypalRequest: provider }));
import {
  captureOrder,
  commitState,
  createOrder,
  ownedRegistration,
  statusPayment,
  webhook
} from "../lib/paypal/service";
import { hashCapability } from "../lib/security/checkout";
const capability = "a".repeat(64);
const registrationId = "6c22c670-83ab-4f28-bccf-b4c1c6861dc4";
let payment: Payment, registration: Registration, captured: boolean, captureState: string;
let exists: boolean;
const eventIds = new Set<string>();
const amount = { value: "321.23", currency_code: "EUR" };
function order(status = captured ? "COMPLETED" : "APPROVED") {
  return {
    id: "ORDER12345678",
    status,
    intent: "CAPTURE",
    payer: { address: { country_code: "US" } },
    purchase_units: [
      {
        reference_id: registrationId,
        custom_id: payment.id,
        invoice_id: payment.id,
        payee: { merchant_id: "MERCHANT12345" },
        amount,
        ...(captured
          ? {
              payments: {
                captures: [{ id: "CAPTURE12345", status: captureState, amount }]
              }
            }
          : {})
      }
    ]
  };
}
const eventHeaders = new Headers(
  Object.fromEntries(
    [
      "auth-algo",
      "cert-url",
      "transmission-id",
      "transmission-sig",
      "transmission-time"
    ].map((key) => ["paypal-" + key, "test"])
  )
);
eventHeaders.set(
  "paypal-cert-url",
  "https://api.sandbox.paypal.com/v1/notifications/certs/CERT-123"
);
beforeEach(() => {
  vi.resetAllMocks();
  eventIds.clear();
  exists = true;
  captured = false;
  captureState = "COMPLETED";
  for (const [key, value] of Object.entries({
    PAYPAL_ENABLED: "true",
    PAYPAL_CAPTURE_ENABLED: "true",
    PAYPAL_WEBHOOK_ENABLED: "true",
    PAYPAL_RECONCILIATION_ENABLED: "true",
    PAYPAL_ENV: "sandbox",
    PAYPAL_CLIENT_ID: "client",
    PAYPAL_CLIENT_SECRET: "secret",
    PAYPAL_MERCHANT_ID: "MERCHANT12345",
    PAYPAL_WEBHOOK_ID: "webhook",
    PUBLIC_APP_ORIGIN: "https://conference.test"
  }))
    vi.stubEnv(key, value);
  payment = {
    id: "fc37ca51-0d79-401f-a151-0abec5fca8f0",
    registrationId,
    provider: "PAYPAL",
    providerRef: "ORDER12345678",
    amountCents: 32123,
    currency: "EUR",
    status: "PENDING",
    paypalOrderId: "ORDER12345678",
    paypalCaptureId: null,
    createRequestId: "create-key",
    captureRequestId: "capture-key",
    merchantId: "MERCHANT12345",
    environment: "sandbox",
    snapshot: {},
    version: 0,
    operationUntil: null,
    captureStartedAt: null,
    lastReconciledAt: null,
    paidAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null
  };
  registration = {
    id: registrationId,
    guestCheckoutHash: hashCapability(capability),
    status: "PENDING",
    currency: "EUR",
    totalAmountCents: 32123,
    registrationFeeCents: 32123,
    accommodationFeeCents: 0,
    countryName: "United States",
    isQuoteRequired: false,
    createdAt: new Date()
  } as Registration;
  db.registration.findFirst.mockImplementation(async ({ where }) =>
    where.guestCheckoutHash === registration.guestCheckoutHash &&
    where.id === registration.id
      ? { ...registration }
      : null
  );
  db.registration.updateMany.mockImplementation(async ({ where, data }) => {
    if (typeof where.status === "string" && registration.status !== where.status)
      return { count: 0 };
    registration = { ...registration, ...data };
    return { count: 1 };
  });
  db.payment.findFirst.mockImplementation(async () => (exists ? { ...payment } : null));
  db.payment.findUniqueOrThrow.mockImplementation(async () => ({ ...payment }));
  db.payment.create.mockImplementation(async ({ data }) => {
    exists = true;
    payment = { ...payment, ...data };
    return { ...payment };
  });
  db.payment.update.mockImplementation(async ({ data }) => {
    payment = { ...payment, ...data };
    return { ...payment };
  });
  db.payment.updateMany.mockImplementation(
    async ({ where, data }: Prisma.PaymentUpdateManyArgs) => {
      if (where?.version !== undefined && where.version !== payment.version)
        return { count: 0 };
      if (
        where?.operationUntil instanceof Date &&
        payment.operationUntil?.getTime() !== where.operationUntil.getTime()
      )
        return { count: 0 };
      if (where?.captureStartedAt === null && payment.captureStartedAt !== null)
        return { count: 0 };
      if (where?.OR && payment.operationUntil && payment.operationUntil > new Date())
        return { count: 0 };
      const version =
        data.version && typeof data.version === "object" && "increment" in data.version
          ? payment.version + Number(data.version.increment)
          : payment.version;
      payment = { ...payment, ...data, version } as Payment;
      return { count: 1 };
    }
  );
  db.$transaction.mockImplementation(
    async (callback: (tx: typeof db) => Promise<void>) => {
      const oldPayment = { ...payment },
        oldRegistration = { ...registration };
      try {
        return await callback(db);
      } catch (error) {
        payment = oldPayment;
        registration = oldRegistration;
        throw error;
      }
    }
  );
  db.paymentWebhook.findUnique.mockImplementation(async ({ where }) =>
    eventIds.has(where.id) ? { id: where.id } : null
  );
  db.paymentWebhook.create.mockImplementation(async ({ data }) => {
    eventIds.add(data.id);
    return data;
  });
  provider.mockImplementation(async (path: string, method = "GET") => {
    if (path.endsWith("verify-webhook-signature"))
      return { verification_status: "SUCCESS" };
    if (path.endsWith("/capture") && method === "POST") {
      captured = true;
      return order();
    }
    if (path.includes("/v2/payments/captures/"))
      return {
        id: "CAPTURE12345",
        status: captureState,
        amount,
        supplementary_data: { related_ids: { order_id: payment.paypalOrderId } }
      };
    return order(path === "/v2/checkout/orders" ? "CREATED" : undefined);
  });
});
describe("PayPal payment lifecycle", () => {
  it("rejects new checkout while disabled before creating a payment", async () => {
    vi.stubEnv("PAYPAL_ENABLED", "false");
    await expect(createOrder(registrationId, capability)).rejects.toThrow(
      "New checkout is paused."
    );
    expect(db.payment.create).not.toHaveBeenCalled();
    expect(provider).not.toHaveBeenCalled();
  });
  it("permits explicitly enabled in-flight capture during new-checkout shutdown", async () => {
    vi.stubEnv("PAYPAL_ENABLED", "false");
    expect((await captureOrder(registrationId, capability)).status).toBe("PAID");
  });
  it("freeze mode blocks capture but verified reconciliation can still confirm an already captured payment", async () => {
    vi.stubEnv("PAYPAL_ENABLED", "false");
    vi.stubEnv("PAYPAL_CAPTURE_ENABLED", "false");
    await expect(captureOrder(registrationId, capability)).rejects.toThrow(
      "Payment capture is paused."
    );
    expect(provider).not.toHaveBeenCalled();
    captured = true;
    expect((await statusPayment(registrationId, capability)).status).toBe("PAID");
  });
  it("status reads return stored state without provider calls when reconciliation is paused", async () => {
    vi.stubEnv("PAYPAL_RECONCILIATION_ENABLED", "false");
    expect((await statusPayment(registrationId, capability)).status).toBe("PENDING");
    expect(provider).not.toHaveBeenCalled();
  });
  it("does not release a successor's lease after a capture timeout", async () => {
    const nextLease = new Date(Date.now() + 120_000),
      base = provider.getMockImplementation()!;
    provider.mockImplementation(async (path: string, ...args: unknown[]) => {
      if (path.endsWith("/capture")) {
        payment.operationUntil = nextLease;
        throw new Error("timeout");
      }
      return base(path, ...args);
    });
    await expect(captureOrder(registrationId, capability)).rejects.toThrow();
    expect(payment.operationUntil).toEqual(nextLease);
  });
  it("preserves the first capture start time across retries", async () => {
    const first = new Date(Date.now() - 3600_000);
    payment.captureStartedAt = first;
    await captureOrder(registrationId, capability);
    expect(payment.captureStartedAt).toEqual(first);
  });
  it("captures and atomically confirms with a receipt outbox", async () => {
    const result = await captureOrder(registrationId, capability);
    expect(result.status).toBe("PAID");
    expect(registration.status).toBe("CONFIRMED");
    expect(payment.paypalCaptureId).toBe("CAPTURE12345");
    expect(db.paymentOutbox.upsert).toHaveBeenCalledOnce();
    expect(
      provider.mock.calls.find(
        (call) => call[1] === "POST" && call[0].endsWith("/capture")
      )?.[3]
    ).toBe("capture-key");
  });
  it("does not confirm merely from an approved order or status read", async () => {
    await statusPayment(registrationId, capability);
    expect(payment.status).toBe("APPROVED");
    expect(registration.status).toBe("PENDING");
  });
  it("rejects unauthorized access and IDOR before provider calls", async () => {
    await expect(captureOrder(registrationId, "b".repeat(64))).rejects.toThrow();
    await expect(ownedRegistration("other-id", capability)).rejects.toThrow();
    expect(provider).not.toHaveBeenCalled();
  });
  it("stores a pending payment before creating an order and reuses it", async () => {
    exists = false;
    payment.paypalOrderId = null;
    const first = await createOrder(registrationId, capability);
    const second = await createOrder(registrationId, capability);
    expect(first.orderId).toBe(second.orderId);
    expect(db.payment.create).toHaveBeenCalledOnce();
    expect(
      provider.mock.calls.filter((call) => call[0] === "/v2/checkout/orders")
    ).toHaveLength(1);
    expect(db.payment.create.mock.invocationCallOrder[0]).toBeLessThan(
      provider.mock.invocationCallOrder[0]
    );
  });
  it("does not replace an uncertain old create request", async () => {
    payment.paypalOrderId = null;
    payment.createdAt = new Date(Date.now() - 6 * 3600_000);
    await expect(createOrder(registrationId, capability)).rejects.toThrow();
    expect(provider).not.toHaveBeenCalled();
  });
  it("rejects domestic registrations", async () => {
    registration.countryName = "India";
    await expect(createOrder(registrationId, capability)).rejects.toThrow();
    expect(provider).not.toHaveBeenCalled();
  });
  it("rejects sponsorship/exhibition quotes", async () => {
    registration.isQuoteRequired = true;
    await expect(createOrder(registrationId, capability)).rejects.toThrow();
  });
  it("duplicate capture requests reconcile rather than charging twice", async () => {
    await captureOrder(registrationId, capability);
    await captureOrder(registrationId, capability);
    expect(
      provider.mock.calls.filter((call) => call[0].endsWith("/capture"))
    ).toHaveLength(1);
    expect(db.paymentOutbox.upsert).toHaveBeenCalledOnce();
  });
  it("a database lease prevents concurrent captures", async () => {
    const results = await Promise.allSettled([
      captureOrder(registrationId, capability),
      captureOrder(registrationId, capability)
    ]);
    expect(results.some((result) => result.status === "rejected")).toBe(true);
    expect(
      provider.mock.calls.filter((call) => call[0].endsWith("/capture"))
    ).toHaveLength(1);
  });
  it("leaves registrations pending on network timeout", async () => {
    provider.mockRejectedValue(new Error("timeout"));
    await expect(captureOrder(registrationId, capability)).rejects.toThrow();
    expect(registration.status).toBe("PENDING");
    expect(db.paymentOutbox.upsert).not.toHaveBeenCalled();
  });
  it("recovers a capture whose response was lost without capturing again", async () => {
    captured = true;
    payment.captureStartedAt = new Date();
    const result = await captureOrder(registrationId, capability);
    expect(result.status).toBe("PAID");
    expect(provider.mock.calls.some((call) => call[0].endsWith("/capture"))).toBe(false);
  });
  it("rolls back registration confirmation on database failure", async () => {
    db.paymentOutbox.upsert.mockRejectedValue(new Error("database unavailable"));
    await expect(captureOrder(registrationId, capability)).rejects.toThrow();
    expect(payment.status).toBe("PENDING");
    expect(registration.status).toBe("PENDING");
  });
  it("does not confirm a declined capture", async () => {
    captureState = "DECLINED";
    const result = await captureOrder(registrationId, capability);
    expect(result.status).toBe("FAILED");
    expect(registration.status).toBe("PENDING");
  });
  it("rejects wrong-merchant orders before capture", async () => {
    const wrong = order();
    wrong.purchase_units[0].payee.merchant_id = "OTHER";
    provider.mockResolvedValue(wrong);
    await expect(captureOrder(registrationId, capability)).rejects.toThrow();
    expect(provider.mock.calls.some((call) => call[0].endsWith("/capture"))).toBe(false);
  });
  it("rejects provider-confirmed domestic payer before capture", async () => {
    const domestic = order();
    domestic.payer.address.country_code = "IN";
    provider.mockResolvedValue(domestic);
    await expect(captureOrder(registrationId, capability)).rejects.toThrow();
    expect(provider.mock.calls.some((call) => call[0].endsWith("/capture"))).toBe(false);
  });
  it("does not allow a stale update to overwrite a concurrent transition", async () => {
    const stale = { ...payment };
    payment.version++;
    await expect(commitState(stale, "PAID", "CAPTURE12345")).rejects.toThrow();
    expect(registration.status).toBe("PENDING");
  });
  it("cancellation cannot confirm a registration", async () => {
    provider.mockResolvedValue(order("VOIDED"));
    await statusPayment(registrationId, capability);
    expect(payment.status).toBe("CANCELLED");
    expect(registration.status).toBe("PENDING");
  });
});
describe("PayPal webhook processing", () => {
  const event = () => ({
    id: "WH-EXAMPLE",
    event_type: "PAYMENT.CAPTURE.COMPLETED",
    resource: {
      id: "CAPTURE12345",
      status: "COMPLETED",
      supplementary_data: { related_ids: { order_id: "ORDER12345678" } }
    }
  });
  it("continues verified webhook processing during checkout/capture/reconciliation shutdown", async () => {
    vi.stubEnv("PAYPAL_ENABLED", "false");
    vi.stubEnv("PAYPAL_CAPTURE_ENABLED", "false");
    vi.stubEnv("PAYPAL_RECONCILIATION_ENABLED", "false");
    captured = true;
    await webhook(event(), eventHeaders);
    expect(payment.status).toBe("PAID");
    expect(registration.status).toBe("CONFIRMED");
  });
  it("returns retryable failure when webhook processing is explicitly paused", async () => {
    vi.stubEnv("PAYPAL_WEBHOOK_ENABLED", "false");
    await expect(webhook(event(), eventHeaders)).rejects.toThrow(
      "Payment processing is paused;"
    );
    expect(provider).not.toHaveBeenCalled();
    expect(db.paymentWebhook.create).not.toHaveBeenCalled();
  });
  it("verifies real-format PayPal certificate URLs containing lowercase hex", async () => {
    captured = true;
    const headers = new Headers(eventHeaders);
    headers.set("paypal-cert-url", "https://api.sandbox.paypal.com/v1/notifications/certs/CERT-360caa42-fca2a594-ab66f33d");
    await webhook(event(), headers);
    expect(provider).toHaveBeenCalledWith(
      "/v1/notifications/verify-webhook-signature",
      "POST",
      expect.objectContaining({ cert_url: headers.get("paypal-cert-url") })
    );
    expect(payment.status).toBe("PAID");
  });
  it.each([
    "https://api.sandbox.paypal.com.attacker.test/v1/notifications/certs/CERT-abc123",
    "https://api.sandbox.paypal.com/v1/notifications/certs/CERT-abc123?redirect=other",
    "http://api.sandbox.paypal.com/v1/notifications/certs/CERT-abc123"
  ])("rejects untrusted certificate URL %s before contacting PayPal", async (url) => {
    const headers = new Headers(eventHeaders);
    headers.set("paypal-cert-url", url);
    await expect(webhook(event(), headers)).rejects.toThrow("Invalid certificate URL");
    expect(provider).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it("rejects forged signatures before touching payment state", async () => {
    provider.mockResolvedValue({ verification_status: "FAILURE" });
    await expect(webhook(event(), eventHeaders)).rejects.toThrow();
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(registration.status).toBe("PENDING");
  });
  it("does not trust COMPLETED in a signed event without authoritative capture", async () => {
    await expect(webhook(event(), eventHeaders)).rejects.toThrow();
    expect(payment.status).toBe("PENDING");
    expect(registration.status).toBe("PENDING");
    expect(db.paymentWebhook.create).not.toHaveBeenCalled();
  });
  it("deduplicates event IDs and confirmation email", async () => {
    captured = true;
    await webhook(event(), eventHeaders);
    await webhook(event(), eventHeaders);
    expect(db.paymentWebhook.create).toHaveBeenCalledOnce();
    expect(db.paymentOutbox.upsert).toHaveBeenCalledOnce();
  });
  it("does not undo a refund when an old completed event arrives", async () => {
    captured = true;
    captureState = "REFUNDED";
    payment.status = "REFUNDED";
    payment.paypalCaptureId = "CAPTURE12345";
    registration.status = "CANCELLED";
    await webhook(event(), eventHeaders);
    expect(payment.status).toBe("REFUNDED");
    expect(registration.status).toBe("CANCELLED");
  });
  it("reconciles refund events and cancels confirmation", async () => {
    captured = true;
    captureState = "REFUNDED";
    payment.status = "PAID";
    payment.paypalCaptureId = "CAPTURE12345";
    registration.status = "CONFIRMED";
    await webhook(
      {
        ...event(),
        event_type: "PAYMENT.CAPTURE.REFUNDED",
        resource: {
          id: "REFUND123456",
          links: [
            {
              rel: "up",
              href: "https://api.sandbox.paypal.com/v2/payments/captures/CAPTURE12345"
            }
          ]
        }
      },
      eventHeaders
    );
    expect(payment.status).toBe("REFUNDED");
    expect(registration.status).toBe("CANCELLED");
  });
  it("fetches reversal evidence independently before suspending registration", async () => {
    captured = true;
    payment.status = "PAID";
    payment.paypalCaptureId = "CAPTURE12345";
    registration.status = "CONFIRMED";
    const base = provider.getMockImplementation()!;
    provider.mockImplementation(async (path: string, ...args: unknown[]) =>
      path.includes("webhooks-events")
        ? {
            ...event(),
            event_type: "PAYMENT.CAPTURE.REVERSED",
            resource: { id: "CAPTURE12345", amount }
          }
        : base(path, ...args)
    );
    await webhook({ ...event(), event_type: "PAYMENT.CAPTURE.REVERSED" }, eventHeaders);
    expect(payment.status).toBe("REVERSED");
    expect(registration.status).toBe("CANCELLED");
  });
  it("returns a retryable failure on provider outage", async () => {
    provider.mockRejectedValue(new Error("offline"));
    await expect(webhook(event(), eventHeaders)).rejects.toThrow();
    expect(db.paymentWebhook.create).not.toHaveBeenCalled();
  });
  it("binds refund-shaped reversal resources to their parent capture", async () => {
    captured = true;
    payment.status = "PAID";
    payment.paypalCaptureId = "CAPTURE12345";
    registration.status = "CONFIRMED";
    const reversal = {
      id: "WH-REVERSAL",
      event_type: "PAYMENT.CAPTURE.REVERSED",
      resource: {
        id: "REFUND123456",
        amount,
        links: [
          {
            rel: "up",
            href: "https://api.sandbox.paypal.com/v2/payments/captures/CAPTURE12345"
          }
        ]
      }
    };
    const base = provider.getMockImplementation()!;
    provider.mockImplementation(async (path: string, ...args: unknown[]) =>
      path.includes("webhooks-events") ? reversal : base(path, ...args)
    );
    await webhook(reversal, eventHeaders);
    expect(payment.status).toBe("REVERSED");
    expect(registration.status).toBe("CANCELLED");
  });
  it("rejects a signed event referring to a different capture", async () => {
    captured = true;
    await expect(
      webhook(
        { ...event(), resource: { ...event().resource, id: "OTHERCAPTURE" } },
        eventHeaders
      )
    ).rejects.toThrow();
    expect(db.paymentWebhook.create).not.toHaveBeenCalled();
    expect(registration.status).toBe("PENDING");
  });
});
