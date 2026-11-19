import { sendSmtpEmail, smtpConfigured } from "@/lib/email/smtp";
import { Resend } from "resend";
import { getPublicAppUrl } from "@/lib/config/env";
import { logger } from "@/lib/logging/logger";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export interface EmailProvider {
  send(payload: EmailPayload): Promise<void>;
}

class ResendEmailProvider implements EmailProvider {
  private readonly resend: Resend;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
  }

  async send(payload: EmailPayload): Promise<void> {
    const result = await this.resend.emails.send({
      from: "ICGIT 2026 <noreply@icgit2026.org>",
      ...payload
    });
    if (result.error) throw new Error("Email provider rejected delivery.");
  }
}

class NullEmailProvider implements EmailProvider {
  async send(payload: EmailPayload): Promise<void> {
    logger.info("Email provider not configured; skipped send", {
      metadata: { subject: payload.subject }
    });
  }
}

class SmtpEmailProvider implements EmailProvider {
  async send(payload: EmailPayload): Promise<void> {
    await sendSmtpEmail({
      from: process.env.SMTP_FROM || process.env.PAYMENT_EMAIL_FROM || "",
      ...payload
    });
  }
}

function getEmailProvider(): EmailProvider {
  if (process.env.EMAIL_PROVIDER === "smtp") {
    return smtpConfigured() ? new SmtpEmailProvider() : new NullEmailProvider();
  }
  const apiKey = process.env.RESEND_API_KEY;
  return apiKey ? new ResendEmailProvider(apiKey) : new NullEmailProvider();
}

export class EmailService {
  private readonly provider = getEmailProvider();

  async sendRegistrationConfirmation(to: string, name: string): Promise<void> {
    await this.provider.send({
      to,
      subject: "ICGIT 2026 registration received",
      html: `<p>Hello ${escapeHtml(name)},</p><p>Your ICGIT 2026 registration request has been received. Payment and accommodation are not yet confirmed.</p>`
    });
  }

  async sendAbstractConfirmation(to: string, title: string): Promise<void> {
    await this.provider.send({
      to,
      subject: "ICGIT 2026 abstract received",
      html: `<p>Your abstract <strong>${escapeHtml(title)}</strong> has been submitted for review.</p>`
    });
  }

  async sendAcceptanceNotification(to: string, title: string): Promise<void> {
    await this.provider.send({
      to,
      subject: "ICGIT 2026 abstract accepted",
      html: `<p>Your abstract <strong>${escapeHtml(title)}</strong> has been accepted. Visit ${escapeHtml(getPublicAppUrl())} for updates.</p>`
    });
  }

  async sendContactAcknowledgement(to: string, name: string): Promise<void> {
    await this.provider.send({
      to,
      subject: "ICGIT 2026 inquiry received",
      html: `<p>Hello ${escapeHtml(name)},</p><p>The organizing team has received your inquiry.</p>`
    });
  }
}

export const emailService = new EmailService();
export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!
  );
}
