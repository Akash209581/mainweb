// @vitest-environment node
import { scryptSync } from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
const { token, bucket, admin, audit } = vi.hoisted(() => ({
  token: "a".repeat(64),
  bucket: vi.fn(),
  admin: vi.fn(),
  audit: vi.fn()
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: token }) })
}));
vi.mock("@/lib/prisma/client", () => ({
  prisma: { requestBucket: { upsert: bucket }, auditLog: { create: audit } }
}));
vi.mock("@/lib/security/admin-access", () => ({ hasAdminSession: admin }));
import { DELETE, POST } from "../app/api/admin/session/route";
import { csrfToken } from "../lib/security/checkout";
import { requireAdminMutation } from "../lib/security/admin-mutation";
import { createSession, validSession } from "../lib/security/admin-session";
const password = "test-password-for-tests-only";
function request(secret = password, csrf = csrfToken(token)) {
  return new Request("https://conference.test/ICGIT/api/admin/session", {
    method: "POST",
    headers: {
      origin: "https://conference.test",
      "content-type": "application/json",
      "x-csrf-token": csrf
    },
    body: JSON.stringify({ email: "admin@example.test", password: secret })
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("PUBLIC_APP_ORIGIN", "https://conference.test");
  vi.stubEnv("ADMIN_EMAIL", "admin@example.test");
  vi.stubEnv("ADMIN_SESSION_SECRET", "test-session-secret-".repeat(3));
  const salt = "ab".repeat(16);
  vi.stubEnv(
    "ADMIN_PASSWORD_HASH",
    "scrypt$" + salt + "$" + scryptSync(password, salt, 64).toString("hex")
  );
  bucket.mockResolvedValue({ count: 1 });
  admin.mockResolvedValue(true);
});
describe("credential-verified administrator sessions", () => {
  it("invalidates previously signed sessions after signing-secret rotation", async () => {
    const original = "old-test-signing-key-".repeat(3),
      rotated = "new-test-signing-key-".repeat(3);
    const signed = await createSession(original);
    expect(await validSession(signed, original)).toBe(true);
    expect(await validSession(signed, rotated)).toBe(false);
  });
  it("records successful/failed credential checks without credentials or session tokens", async () => {
    await POST(request("wrong"));
    await POST(request());
    expect(audit.mock.calls.map((call) => call[0].data.action)).toEqual([
      "admin.login.failed",
      "admin.login.succeeded"
    ]);
    const data = JSON.stringify(audit.mock.calls);
    expect(data).not.toContain(password);
    expect(data).not.toContain(token);
  });
  it("does not issue a session if durable authentication auditing fails", async () => {
    audit.mockRejectedValue(new Error("database connection detail"));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(await response.text()).not.toContain("database connection detail");
  });
  it("rejects incorrect credentials", async () => {
    const response = await POST(request("wrong"));
    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });
  it("does not issue sessions when login CSRF is missing", async () => {
    expect((await POST(request(password, ""))).status).toBe(403);
    expect(bucket).not.toHaveBeenCalled();
  });
  it("issues an HttpOnly restricted cookie after correct credentials", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=strict");
    expect(response.headers.get("set-cookie")).toContain("Path=/ICGIT");
  });
  it("fails closed without configured credentials", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "");
    expect((await POST(request())).status).toBe(503);
  });
  it("requires authorization and CSRF for settings/upload mutations", async () => {
    admin.mockResolvedValue(false);
    await expect(requireAdminMutation(request())).rejects.toThrow();
    admin.mockResolvedValue(true);
    await expect(requireAdminMutation(request(password, "forged"))).rejects.toThrow();
  });
  it("logout expires both current and legacy cookie paths", async () => {
    const response = await DELETE(request());
    expect(response.status).toBe(200);
    const cookies = response.headers.get("set-cookie") || "";
    expect(cookies).toContain("Path=/ICGIT");
    expect(cookies).toContain("Path=/;");
  });
});
