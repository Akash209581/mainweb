// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { paypalConfig } from "../lib/paypal/config";
beforeEach(() => {
  vi.resetModules();
  for (const [key, value] of Object.entries({
    PAYPAL_ENV: "sandbox",
    PAYPAL_CLIENT_ID: "client",
    PAYPAL_CLIENT_SECRET: "test-secret",
    PAYPAL_MERCHANT_ID: "MERCHANT12345",
    PAYPAL_WEBHOOK_ID: "webhook",
    PUBLIC_APP_ORIGIN: "https://conference.test",
    PAYPAL_ENABLED: "false",
    PAYPAL_CAPTURE_ENABLED: "false",
    PAYPAL_WEBHOOK_ENABLED: "true",
    PAYPAL_RECONCILIATION_ENABLED: "true",
    PAYPAL_LIVE_APPROVED: "false"
  }))
    vi.stubEnv(key, value);
});
describe("independent emergency controls", () => {
  it("freezes new orders and capture while retaining signature verification and reconciliation", () => {
    expect(() => paypalConfig("create")).toThrow("New checkout is paused.");
    expect(() => paypalConfig("capture")).toThrow("Payment capture is paused.");
    expect(() => paypalConfig("webhook")).not.toThrow();
    expect(() => paypalConfig("reconcile")).not.toThrow();
  });
  it("can drain in-flight captures without accepting new orders", () => {
    vi.stubEnv("PAYPAL_CAPTURE_ENABLED", "true");
    expect(() => paypalConfig("capture")).not.toThrow();
    expect(() => paypalConfig("create")).toThrow();
  });
  it("can freeze captures while accepting no hidden capture through another context", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const { paypalRequest } = await import("../lib/paypal/provider");
    await expect(
      paypalRequest(
        "/v2/checkout/orders/ORDER12345678/capture",
        "POST",
        {},
        "key",
        "webhook"
      )
    ).rejects.toThrow("Payment capture is paused.");
    await expect(
      paypalRequest("/v2/checkout/orders", "POST", {}, "key", "reconcile")
    ).rejects.toThrow("New checkout is paused.");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("webhook reads work independently of scheduled reconciliation", async () => {
    vi.stubEnv("PAYPAL_RECONCILIATION_ENABLED", "false");
    const fetch = vi.fn(async (url: string) =>
      Response.json(
        url.endsWith("/token") ? { access_token: "token", expires_in: 3600 } : {}
      )
    );
    vi.stubGlobal("fetch", fetch);
    const { paypalRequest } = await import("../lib/paypal/provider");
    await expect(
      paypalRequest(
        "/v2/checkout/orders/ORDER12345678",
        "GET",
        undefined,
        undefined,
        "webhook"
      )
    ).resolves.toEqual({});
    await expect(paypalRequest("/v2/checkout/orders/ORDER12345678")).rejects.toThrow(
      "Payment processing is paused;"
    );
  });
  it("independently pauses webhook processing without disabling reconciliation", () => {
    vi.stubEnv("PAYPAL_WEBHOOK_ENABLED", "false");
    expect(() => paypalConfig("webhook")).toThrow();
    expect(() => paypalConfig("reconcile")).not.toThrow();
  });
  it("rejects malformed switches rather than treating them as enabled", () => {
    vi.stubEnv("PAYPAL_CAPTURE_ENABLED", "yes");
    expect(() => paypalConfig("capture")).toThrow();
  });
  it("never enables live mode through an emergency switch", () => {
    vi.stubEnv("PAYPAL_ENV", "live");
    vi.stubEnv("PAYPAL_CAPTURE_ENABLED", "true");
    expect(() => paypalConfig("capture")).toThrow("Live checkout is not enabled.");
    expect(() => paypalConfig("webhook")).toThrow("Live checkout is not enabled.");
  });
});
