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
    await this.resend.emails.send({
      from: "ICGIT 2026 <noreply@icgit2026.org>",
      ...payload
    });
  }
}

class NullEmailProvider implements EmailProvider {
  async send(payload: EmailPayload): Promise<void> {
    logger.info("Email provider not configured; skipped send", {
      metadata: { to: payload.to, subject: payload.subject }
    });
  }
}

function getEmailProvider(): EmailProvider {
  const apiKey = process.env.RESEND_API_KEY;
  return apiKey ? new ResendEmailProvider(apiKey) : new NullEmailProvider();
}

export class EmailService {
  private readonly provider = getEmailProvider();

  async sendRegistrationConfirmation(to: string, name: string): Promise<void> {
    await this.provider.send({
      to,
      subject: "ICGIT 2026 registration received",
      html: `<p>Hello ${name},</p><p>Your ICGIT 2026 registration request has been received.</p>`
    });
  }

  async sendAbstractConfirmation(to: string, title: string): Promise<void> {
    await this.provider.send({
      to,
      subject: "ICGIT 2026 abstract received",
      html: `<p>Your abstract <strong>${title}</strong> has been submitted for review.</p>`
    });
  }

  async sendAcceptanceNotification(to: string, title: string): Promise<void> {
    await this.provider.send({
      to,
      subject: "ICGIT 2026 abstract accepted",
      html: `<p>Your abstract <strong>${title}</strong> has been accepted. Visit ${getPublicAppUrl()} for updates.</p>`
    });
  }

  async sendContactAcknowledgement(to: string, name: string): Promise<void> {
    await this.provider.send({
      to,
      subject: "ICGIT 2026 inquiry received",
      html: `<p>Hello ${name},</p><p>The organizing team has received your inquiry.</p>`
    });
  }
}

export const emailService = new EmailService();
