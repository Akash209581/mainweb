// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { send, findConference } = vi.hoisted(() => ({
  send: vi.fn(),
  findConference: vi.fn()
}));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  }
}));
vi.mock("@/lib/prisma/client", () => ({
  prisma: { conference: { findFirst: findConference } }
}));
import { EmailService } from "../lib/services/email.service";
import { GET } from "../app/hanvo/health/route";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("RESEND_API_KEY", "test-key");
  vi.stubEnv("EMAIL_PROVIDER", "resend");
});
afterEach(() => vi.unstubAllEnvs());

describe("operational error handling", () => {
  it("rejects email delivery when the provider returns an error without throwing", async () => {
    send.mockResolvedValue({ data: null, error: { message: "Rejected" } });
    await expect(
      new EmailService().sendRegistrationConfirmation("person@example.test", "Person")
    ).rejects.toThrow("Email provider rejected delivery");
  });
  it("accepts successful provider delivery and escapes participant text", async () => {
    send.mockResolvedValue({ data: { id: "message" }, error: null });
    await new EmailService().sendRegistrationConfirmation(
      "person@example.test",
      "<script>"
    );
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ html: expect.stringContaining("&lt;script&gt;") })
    );
  });
  it("does not expose connection details in public health responses", async () => {
    findConference.mockRejectedValue(
      new Error("private database address and credentials")
    );
    const response = await GET();
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({
      status: "DOWN",
      error: "Database connection failed"
    });
  });
});
