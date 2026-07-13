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

