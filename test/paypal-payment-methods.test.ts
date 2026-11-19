// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const { owned, guest, limit } = vi.hoisted(() => ({
  owned: vi.fn(),
  guest: vi.fn(),
  limit: vi.fn()
}));
vi.mock("@/lib/paypal/service", () => ({ ownedRegistration: owned }));
vi.mock("@/lib/security/checkout", async (original) => ({
  ...(await original<typeof import("../lib/security/checkout")>()),
  guestCapability: guest,
  limitRequests: limit
}));
vi.mock("@/lib/prisma/client", () => ({ prisma: {} }));
import { GET, POST } from "../app/hanvo/checkout/[registrationId]/route";
import { csrfToken } from "../lib/security/checkout";
import { PaymentError } from "../lib/paypal/config";
const capability = "a".repeat(64);
const id = "6c22c670-83ab-4f28-bccf-b4c1c6861dc4";
const context = () => ({ params: Promise.resolve({ registrationId: id }) });
function request(body: unknown, token = csrfToken(capability)) {
  return new Request("https://conference.test/ICGIT/hanvo/checkout/" + id, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://conference.test",
      "x-csrf-token": token
    },
    body: JSON.stringify(body)
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  guest.mockResolvedValue(capability);
  owned.mockResolvedValue({ totalAmountCents: 12500, currency: "USD" });
  for (const [key, value] of Object.entries({
    PAYPAL_ENABLED: "true",
    PAYPAL_CAPTURE_ENABLED: "true",
    PAYPAL_ENV: "sandbox",
    PAYPAL_CLIENT_ID: "public-client",
    PAYPAL_CLIENT_SECRET: "private-secret",
    PAYPAL_MERCHANT_ID: "MERCHANT12345",
    PAYPAL_WEBHOOK_ID: "webhook",
    PUBLIC_APP_ORIGIN: "https://conference.test"
  }))
    vi.stubEnv(key, value);
});
afterEach(() => vi.unstubAllEnvs());
describe("server-validated payment method selection", () => {
  it("returns saved server pricing and availability without credentials", async () => {
    const response = await GET(new Request("https://conference.test"), context());
    const data = await response.json();
    expect(data.amountCents).toBe(12500);
    expect(data.currency).toBe("USD");
    expect(
      data.methods.map((m: { provider: string; available: boolean }) => [
        m.provider,
        m.available
      ])
    ).toEqual([
      ["PAYPAL", true],
      ["STRIPE", false]
    ]);
    expect(JSON.stringify(data)).not.toContain("private-secret");
    expect(data).not.toHaveProperty("clientId");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(owned).toHaveBeenCalledWith(id, capability);
  });
  it("dispatches PayPal only after ownership and CSRF validation", async () => {
    const response = await POST(request({ provider: "PAYPAL" }), context());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ provider: "PAYPAL" });
    expect(owned).toHaveBeenCalledWith(id, capability);
  });
  it("rejects Stripe even if a caller supplies Stripe configuration", async () => {
    vi.stubEnv("STRIPE_ENABLED", "true");
    vi.stubEnv("STRIPE_SECRET_KEY", "must-not-be-used");
    expect((await POST(request({ provider: "STRIPE" }), context())).status).toBe(503);
  });
  for (const body of [
    { provider: "OTHER" },
    { provider: "PAYPAL", amountCents: 1 },
    { provider: "PAYPAL", currency: "EUR" },
    { provider: "PAYPAL", status: "PAID" },
    {}
  ])
    it("rejects unknown providers and client payment-field assignment", async () => {
      expect((await POST(request(body), context())).status).toBe(400);
      expect(owned).not.toHaveBeenCalled();
    });
  it("rejects selection without CSRF", async () => {
    expect((await POST(request({ provider: "PAYPAL" }, ""), context())).status).toBe(403);
    expect(owned).not.toHaveBeenCalled();
  });
  it("does not disclose pricing for another participant", async () => {
    owned.mockRejectedValue(new PaymentError("Registration not found.", 404));
    const response = await GET(new Request("https://conference.test"), context());
    expect(response.status).toBe(404);
    expect(await response.json()).not.toHaveProperty("amountCents");
  });
  it("rechecks shutdown flags on selection", async () => {
    vi.stubEnv("PAYPAL_ENABLED", "false");
    vi.stubEnv("PAYPAL_CAPTURE_ENABLED", "false");
    expect((await POST(request({ provider: "PAYPAL" }), context())).status).toBe(503);
  });
  it("keeps capture-drain selection available while new creates are paused", async () => {
    vi.stubEnv("PAYPAL_ENABLED", "false");
    expect((await POST(request({ provider: "PAYPAL" }), context())).status).toBe(200);
  });
  it("disables PayPal with incomplete configuration", async () => {
    vi.stubEnv("PAYPAL_CLIENT_SECRET", "");
    const response = await GET(new Request("https://conference.test"), context());
    expect(
      (await response.json()).methods.every((m: { available: boolean }) => !m.available)
    ).toBe(true);
  });
});
