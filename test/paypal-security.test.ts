// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const { bucket, jar } = vi.hoisted(() => ({
  bucket: vi.fn(),
  jar: new Map<string, string>()
}));
vi.mock("@/lib/prisma/client", () => ({ prisma: { requestBucket: { upsert: bucket } } }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (key: string) => (jar.has(key) ? { value: jar.get(key) } : undefined),
    set: (key: string, value: string) => jar.set(key, value)
  })
}));
import {
  csrfToken,
  equalToken,
  guestCapability,
  hashCapability,
  limitRequests,
  readJson,
  requireCsrf
} from "../lib/security/checkout";
describe("checkout request security", () => {
  beforeEach(() => {
    jar.clear();
    bucket.mockReset();
    vi.stubEnv("PUBLIC_APP_ORIGIN", "https://conference.test");
  });
  it("creates an opaque guest capability and retains it for the browser", async () => {
    const first = await guestCapability(true);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(await guestCapability()).toBe(first);
    expect(hashCapability(first)).not.toBe(first);
  });
  it("rejects missing ownership", async () => {
    await expect(guestCapability()).rejects.toThrow();
  });
  it("requires both the CSRF token and exact configured Origin", () => {
    const token = "secret";
    const request = (origin: string, csrf: string) =>
      new Request("https://conference.test/ICGIT/hanvo/paypal/test", {
        method: "POST",
        headers: { origin, "x-csrf-token": csrf }
      });
    expect(() =>
      requireCsrf(request("https://conference.test", csrfToken(token)), token)
    ).not.toThrow();
    expect(() =>
      requireCsrf(request("https://attacker.test", csrfToken(token)), token)
    ).toThrow();
    expect(() =>
      requireCsrf(request("https://conference.test", "forged"), token)
    ).toThrow();
    expect(() => requireCsrf(request("", csrfToken(token)), token)).toThrow();
  });
  it("rejects different byte lengths safely", () =>
    expect(equalToken("é", "a")).toBe(false));
  it("enforces shared database rate limits", async () => {
    bucket.mockResolvedValue({ count: 11 });
    await expect(limitRequests("key", 10)).rejects.toThrow();
  });
  it("fails closed on rate-limit database failure", async () => {
    bucket.mockRejectedValue(new Error("offline"));
    await expect(limitRequests("key")).rejects.toThrow();
  });
  it("rejects oversized and malformed bodies", async () => {
    await expect(
      readJson(
        new Request("https://conference.test", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "x".repeat(5000)
        })
      )
    ).rejects.toThrow();
    await expect(
      readJson(
        new Request("https://conference.test", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{"
        })
      )
    ).rejects.toThrow();
  });
});
