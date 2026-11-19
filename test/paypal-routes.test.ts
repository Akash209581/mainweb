// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const { create, capture, status, guest, limit } = vi.hoisted(() => ({
  create: vi.fn(),
  capture: vi.fn(),
  status: vi.fn(),
  guest: vi.fn(),
  limit: vi.fn()
}));
vi.mock("@/lib/paypal/service", () => ({
  createOrder: create,
  captureOrder: capture,
  statusPayment: status
}));
vi.mock("@/lib/security/checkout", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/security/checkout")>()),
  guestCapability: guest,
  limitRequests: limit
}));
vi.mock("@/lib/prisma/client", () => ({ prisma: {} }));
import { GET, POST } from "../app/hanvo/paypal/[registrationId]/route";
import { csrfToken } from "../lib/security/checkout";
const token = "a".repeat(64);
const id = "6c22c670-83ab-4f28-bccf-b4c1c6861dc4";
const context = () => ({ params: Promise.resolve({ registrationId: id }) });
function request(body: unknown, csrf = csrfToken(token)) {
  return new Request("https://conference.test/ICGIT/hanvo/paypal/" + id, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://conference.test",
      "x-csrf-token": csrf
    },
    body: JSON.stringify(body)
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  guest.mockResolvedValue(token);
  status.mockResolvedValue({ status: "PENDING" });
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
describe("checkout HTTP contract", () => {
  it("rejects routing Stripe through the PayPal payment endpoint", async () => {
    const response = await POST(
      request({ action: "create", provider: "STRIPE" }),
      context()
    );
    expect(response.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
    expect(capture).not.toHaveBeenCalled();
  });
  for (const field of [
    "amount",
    "currency",
    "orderId",
    "paymentStatus",
    "payer",
    "discount"
  ])
    it(`rejects client ${field} mass assignment`, async () => {
      const response = await POST(
        request({ action: "capture", [field]: "forged" }),
        context()
      );
      expect(response.status).toBe(400);
      expect(capture).not.toHaveBeenCalled();
    });
  it("rejects missing CSRF verification before payment work", async () => {
    expect((await POST(request({ action: "capture" }, ""), context())).status).toBe(403);
    expect(capture).not.toHaveBeenCalled();
  });
  it("never accepts a redirect/query status as payment evidence", async () => {
    const response = await GET(
      new Request(
        "https://conference.test/ICGIT/hanvo/paypal/" + id + "?status=PAID&success=true"
      ),
      context()
    );
    const data = await response.json();
    expect(data.status).toBe("PENDING");
    expect(capture).not.toHaveBeenCalled();
    expect(data.clientId).toBe("public-client");
    expect(JSON.stringify(data)).not.toContain("private-secret");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("does not expose internal/provider failures", async () => {
    create.mockRejectedValue(new Error("private-secret token database-password"));
    const response = await POST(request({ action: "create" }), context());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("private-secret");
  });
  it("rejects malformed registration IDs", async () => {
    const response = await POST(request({ action: "create" }), {
      params: Promise.resolve({ registrationId: "../../other" })
    });
    expect(response.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });
});
