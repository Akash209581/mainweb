"use server";

import { headers } from "next/headers";
import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";
import { getClientIp, enforceRateLimit } from "@/lib/security/rate-limit";
import { submitContactMessage } from "@/lib/services/contact.service";
import { formatZodError } from "@/lib/validation/format";
import { contactSchema } from "@/lib/validation/schemas";

export interface ActionState {
  ok: boolean;
  message: string;
}

export async function submitContactAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const requestHeaders = await headers();
    const ipAddress = getClientIp(requestHeaders);
    enforceRateLimit(`contact:${ipAddress}`, 3, 60_000);

    const parsed = contactSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      category: formData.get("category"),
      message: formData.get("message")
    });

    if (!parsed.success) {
      return { ok: false, message: formatZodError(parsed.error) };
    }

    await submitContactMessage(parsed.data, {
      ipAddress,
      userAgent: requestHeaders.get("user-agent") ?? undefined
    });

    return { ok: true, message: "Your inquiry has been submitted." };
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, message: error.message };
    }

    logger.error("submitContactAction unexpected error", {
      metadata: {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      }
    });

    return { ok: false, message: "An unexpected error occurred. Please try again later." };
  }
}

export async function submitBrochureRequestAction(payload: {
  first: string;
  last: string;
  email: string;
  phone?: string;
  institution?: string;
  country: string;
  interest: string;
  updates?: boolean;
}): Promise<ActionState> {
  try {
    const requestHeaders = await headers();
    const ipAddress = getClientIp(requestHeaders);
    enforceRateLimit(`brochure:${ipAddress}`, 5, 60_000);

    const fullName = `${payload.first} ${payload.last}`.trim();
    const message = `Brochure Request:\nName: ${fullName}\nEmail: ${payload.email}\nPhone: ${payload.phone || "N/A"}\nInstitution: ${payload.institution || "N/A"}\nCountry: ${payload.country}\nInterest: ${payload.interest}\nReceive updates: ${payload.updates ? "Yes" : "No"}`;

    await submitContactMessage(
      {
        name: fullName,
        email: payload.email,
        category: "delegate",
        message
      },
      {
        ipAddress,
        userAgent: requestHeaders.get("user-agent") ?? undefined
      }
    );

    return { ok: true, message: "Brochure request registered successfully!" };
  } catch (error) {
    return { ok: false, message: "Unable to save your brochure request. Please try again." };
  }
}

export async function submitConferenceQueryAction(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<ActionState> {
  try {
    const requestHeaders = await headers();
    const ipAddress = getClientIp(requestHeaders);
    enforceRateLimit(`query:${ipAddress}`, 5, 60_000);

    await submitContactMessage(
      {
        name: payload.name,
        email: payload.email,
        category: "delegate",
        message: `[Subject: ${payload.subject}]\n\n${payload.message}`
      },
      {
        ipAddress,
        userAgent: requestHeaders.get("user-agent") ?? undefined
      }
    );

    return { ok: true, message: "Your query has been submitted to the secretariat." };
  } catch (error) {
    return { ok: false, message: "Unable to save your query. Please try again." };
  }
}

