// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const { create, send, verify, close } = vi.hoisted(() => ({
  create: vi.fn(),
  send: vi.fn(),
  verify: vi.fn(),
  close: vi.fn()
}));
vi.mock("nodemailer", () => ({ default: { createTransport: create } }));
import {
  sendSmtpEmail,
  smtpConfigured,
  SmtpDeliveryError,
  verifySmtpConnection
} from "../lib/email/smtp";
beforeEach(() => {
  vi.resetAllMocks();
  for (const [key, value] of Object.entries({
    SMTP_HOST: "mail.example.test",
    SMTP_PORT: "465",
    SMTP_SECURE: "true",
    SMTP_USER: "info@example.test",
    SMTP_PASSWORD: "test-password"
  }))
    vi.stubEnv(key, value);
  create.mockReturnValue({ sendMail: send, verify, close });
  send.mockResolvedValue({ accepted: ["guest@example.test"], rejected: [] });
});
afterEach(() => vi.unstubAllEnvs());
const message = {
  from: "Conference <info@example.test>",
  to: "guest@example.test",
  subject: "Payment successful",
  text: "Verified payment"
};
describe("SMTP delivery", () => {
  it("uses verified implicit TLS, bounded timeouts, and no protocol logging", async () => {
    await sendSmtpEmail(message, "payment-1");
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        secure: true,
        tls: { minVersion: "TLSv1.2", rejectUnauthorized: true },
        debug: false,
        logger: false,
        socketTimeout: 20000
      })
    );
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        ...message,
        messageId: expect.stringMatching(/^<[a-f0-9]{64}@hanscinovum.com>$/)
      })
    );
    expect(close).toHaveBeenCalledOnce();
  });
  it("requires STARTTLS for port 587", async () => {
    vi.stubEnv("SMTP_PORT", "587");
    vi.stubEnv("SMTP_SECURE", "false");
    await sendSmtpEmail(message);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ secure: false, requireTLS: true })
    );
  });
  it("does not send with missing credentials or mismatched TLS on port 465", async () => {
    vi.stubEnv("SMTP_PASSWORD", "");
    expect(smtpConfigured()).toBe(false);
    await expect(sendSmtpEmail(message)).rejects.toBeInstanceOf(SmtpDeliveryError);
    vi.stubEnv("SMTP_PASSWORD", "test");
    vi.stubEnv("SMTP_SECURE", "false");
    expect(smtpConfigured()).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });
  it("treats rejection of the recipient as a failed delivery", async () => {
    send.mockResolvedValue({ accepted: [], rejected: [message.to] });
    await expect(sendSmtpEmail(message)).rejects.toMatchObject({ safeToRetry: true });
  });
  it("allows retry of authentication failures but not a lost response after DATA", async () => {
    send.mockRejectedValueOnce({ code: "EAUTH", command: "AUTH PLAIN" });
    await expect(sendSmtpEmail(message)).rejects.toMatchObject({ safeToRetry: true });
    send.mockRejectedValueOnce({ code: "ETIMEDOUT", command: "DATA" });
    await expect(sendSmtpEmail(message)).rejects.toMatchObject({ safeToRetry: false });
  });
  it("can verify SMTP authentication without sending an email", async () => {
    verify.mockResolvedValue(true);
    await verifySmtpConnection();
    expect(verify).toHaveBeenCalledOnce();
    expect(send).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledOnce();
  });
  it("routes registration email through SMTP using the configured sender", async () => {
    vi.stubEnv("EMAIL_PROVIDER", "smtp");
    vi.stubEnv("SMTP_FROM", message.from);
    const { EmailService } = await import("../lib/services/email.service");
    await new EmailService().sendRegistrationConfirmation(message.to, "Test Participant");
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: message.from,
        to: message.to,
        subject: "ICGIT 2026 registration received"
      })
    );
  });
});
