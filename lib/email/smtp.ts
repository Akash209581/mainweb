import nodemailer from "nodemailer";
import { createHash } from "node:crypto";
import { z } from "zod";

const configSchema = z
  .object({
    SMTP_HOST: z.string().trim().min(1),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535),
    SMTP_SECURE: z.enum(["true", "false"]),
    SMTP_USER: z.string().min(1),
    SMTP_PASSWORD: z.string().min(1)
  })
  .refine(
    (c) => c.SMTP_PORT !== 465 || c.SMTP_SECURE === "true",
    "Port 465 requires implicit TLS."
  );
export function smtpConfigured() {
  return configSchema.safeParse(process.env).success;
}
export class SmtpDeliveryError extends Error {
  constructor(public readonly safeToRetry: boolean) {
    super("SMTP delivery failed.");
  }
}
function transport() {
  const result = configSchema.safeParse(process.env);
  if (!result.success) throw new SmtpDeliveryError(true);
  const c = result.data;
  return nodemailer.createTransport({
    host: c.SMTP_HOST,
    port: c.SMTP_PORT,
    secure: c.SMTP_SECURE === "true",
    requireTLS: c.SMTP_SECURE !== "true",
    auth: { user: c.SMTP_USER, pass: c.SMTP_PASSWORD },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    tls: { minVersion: "TLSv1.2", rejectUnauthorized: true },
    disableFileAccess: true,
    disableUrlAccess: true,
    logger: false,
    debug: false
  });
}
export async function verifySmtpConnection() {
  const client = transport();
  try {
    await client.verify();
  } finally {
    client.close();
  }
}
export async function sendSmtpEmail(
  message: { from: string; to: string; subject: string; text?: string; html?: string },
  deliveryKey?: string
) {
  const client = transport();
  try {
    const info = await client.sendMail({
      ...message,
      ...(deliveryKey
        ? {
            messageId: `<${createHash("sha256").update(deliveryKey).digest("hex")}@hanscinovum.com>`
          }
        : {})
    });
    if (!info.accepted?.length) throw new SmtpDeliveryError(true);
    if (info.rejected?.length) throw new SmtpDeliveryError(false);
  } catch (error) {
    if (error instanceof SmtpDeliveryError) throw error;
    const details = error as { code?: string; command?: string; responseCode?: number };
    const safe =
      details.code === "EAUTH" ||
      /^(CONN|EHLO|HELO|STARTTLS|AUTH|MAIL FROM|RCPT TO)(\b|$)/.test(
        details.command || ""
      ) ||
      (typeof details.responseCode === "number" &&
        details.responseCode >= 400 &&
        details.responseCode <= 599);
    throw new SmtpDeliveryError(safe);
  } finally {
    client.close();
  }
}
