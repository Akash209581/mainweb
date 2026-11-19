// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const fetchMock = vi.fn();
beforeEach(() => {
  vi.resetModules();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  for (const [key, value] of Object.entries({
    PAYPAL_ENABLED: "true",
    PAYPAL_CAPTURE_ENABLED: "true",
    PAYPAL_WEBHOOK_ENABLED: "true",
    PAYPAL_RECONCILIATION_ENABLED: "true",
    PAYPAL_ENV: "sandbox",
    PAYPAL_CLIENT_ID: "client",
    PAYPAL_CLIENT_SECRET: "server-secret",
    PAYPAL_MERCHANT_ID: "MERCHANT12345",
    PAYPAL_WEBHOOK_ID: "webhook",
    PUBLIC_APP_ORIGIN: "https://conference.test",
    PAYPAL_LIVE_APPROVED: "false"
  }))
    vi.stubEnv(key, value);
});
describe("server-only PayPal transport", () => {
  it("caches OAuth and uses persisted request IDs with bounded requests", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      Response.json(
        url.endsWith("/token")
          ? { access_token: "server-access-token", expires_in: 3600 }
          : { id: "ORDER12345678" }
      )
    );
    const { paypalRequest } = await import("../lib/paypal/provider");
    await paypalRequest("/v2/checkout/orders", "POST", {}, "persisted-request-key");
    await paypalRequest("/v2/checkout/orders/ORDER12345678");
    expect(
      fetchMock.mock.calls.filter((call) => call[0].endsWith("/token"))
    ).toHaveLength(1);
    expect(fetchMock.mock.calls[1][1].headers["PayPal-Request-Id"]).toBe(
      "persisted-request-key"
    );
    expect(fetchMock.mock.calls[1][1].redirect).toBe("error");
    expect(fetchMock.mock.calls[1][1].signal).toBeInstanceOf(AbortSignal);
  });
  it("coalesces concurrent OAuth requests", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      Response.json(
        url.endsWith("/token") ? { access_token: "token", expires_in: 3600 } : {}
      )
    );
    const { paypalRequest } = await import("../lib/paypal/provider");
    await Promise.all([
      paypalRequest("/v2/checkout/orders/ORDER12345678"),
      paypalRequest("/v2/checkout/orders/ORDER12345678")
    ]);
    expect(
      fetchMock.mock.calls.filter((call) => call[0].endsWith("/token"))
    ).toHaveLength(1);
  });
  it("rejects arbitrary paths and URLs before any network call", async () => {
    const { paypalRequest } = await import("../lib/paypal/provider");
    await expect(paypalRequest("https://attacker.test/")).rejects.toThrow();
    await expect(paypalRequest("/v2/checkout/orders/../../secrets")).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("redacts provider errors and OAuth failures", async () => {
    fetchMock.mockResolvedValue(new Response("server-secret", { status: 401 }));
    const { paypalRequest } = await import("../lib/paypal/provider");
    await expect(paypalRequest("/v2/checkout/orders")).rejects.not.toThrow(
      "server-secret"
    );
  });
  it("turns network timeouts into safe retry/reconciliation errors", async () => {
    fetchMock.mockRejectedValue(
      new DOMException("sensitive network detail", "TimeoutError")
    );
    const { paypalRequest } = await import("../lib/paypal/provider");
    await expect(paypalRequest("/v2/checkout/orders/ORDER12345678")).rejects.toThrow(
      "Checkout is unavailable."
    );
  });
  it("refuses unapproved live mode and disabled checkout", async () => {
    const { paypalRequest } = await import("../lib/paypal/provider");
    vi.stubEnv("PAYPAL_ENV", "live");
    await expect(
      paypalRequest("/v2/checkout/orders", "POST", {}, "test-key")
    ).rejects.toThrow("Live checkout is not enabled.");
    vi.stubEnv("PAYPAL_ENV", "sandbox");
    vi.stubEnv("PAYPAL_ENABLED", "false");
    await expect(
      paypalRequest("/v2/checkout/orders", "POST", {}, "test-key")
    ).rejects.toThrow("New checkout is paused.");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
