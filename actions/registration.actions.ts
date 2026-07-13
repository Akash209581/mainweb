"use server";

import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";
import { findUserByClerkId } from "@/lib/repositories/user.repository";
import { enforceRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { submitRegistration } from "@/lib/services/registration.service";
import { formatZodError } from "@/lib/validation/format";
import { registrationSchema } from "@/lib/validation/schemas";
import type { ActionState } from "@/actions/contact.actions";
import type { RegistrationStatus } from "@prisma/client";

export async function submitRegistrationAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const requestHeaders = await headers();
    const ipAddress = getClientIp(requestHeaders);
    enforceRateLimit(`registration:${ipAddress}`, 5, 60_000);

    const parsed = registrationSchema.safeParse({
      conferenceSlug: formData.get("conferenceSlug") ?? "icgit-2026",
      packageId: formData.get("packageId"),
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      organization: formData.get("organization") || undefined,
      countryId: formData.get("countryId") || undefined
    });

    if (!parsed.success) {
      return { ok: false, message: formatZodError(parsed.error) };
    }

    const { userId: clerkUserId } = await auth();
    const user = clerkUserId ? await findUserByClerkId(clerkUserId) : null;
    await submitRegistration(parsed.data, user?.id);

    return { ok: true, message: "Your registration has been submitted." };
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, message: error.message };
    }

    logger.error("submitRegistrationAction unexpected error", {
      metadata: {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      }
    });

    return { ok: false, message: "An unexpected error occurred. Please try again later." };
  }
}

export async function updateRegistrationStatusAction(
  registrationId: string,
  status: RegistrationStatus
): Promise<ActionState> {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);

    await prisma.registration.update({
      where: { id: registrationId },
      data: { status }
    });

    return { ok: true, message: `Registration status updated to ${status}.` };
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, message: error.message };
    }
    logger.error("updateRegistrationStatusAction error", { metadata: { error: String(error) } });
    return { ok: false, message: "Failed to update registration status." };
  }
}


