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

export interface RegistrationActionResult {
  ok: boolean;
  message: string;
  referenceNumber?: string;
  isQuoteRequired?: boolean;
  totalAmountCents?: number;
}

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
      packageId: formData.get("packageId") || undefined,
      fullName: formData.get("fullName") || undefined,
      email: formData.get("email"),
      organization: formData.get("organization") || undefined,
      countryId: formData.get("countryId") || undefined,
      first: formData.get("first") || undefined,
      last: formData.get("last") || undefined,
      institution: formData.get("institution") || undefined,
      country: formData.get("country") || undefined,
      category: formData.get("category") || "academic",
      currency: formData.get("currency") || "EUR",
      role: formData.get("role") || undefined,
      abstract: formData.get("abstract") || undefined,
      package: formData.get("package") || undefined,
      representatives: formData.get("representatives") || undefined,
      interests: formData.get("interests") || undefined,
      stay: formData.get("stay") === "true" || formData.get("stay") === "on",
      checkin: formData.get("checkin") || undefined,
      checkout: formData.get("checkout") || undefined,
      room: formData.get("room") || "single",
      rooms: formData.get("rooms") || 1,
      guests: formData.get("guests") || "1",
      beds: formData.get("beds") || "No preference",
      staynotes: formData.get("staynotes") || undefined,
      invoice: formData.get("invoice") === "true" || formData.get("invoice") === "on",
      billingOrg: formData.get("billingOrg") || undefined,
      address: formData.get("address") || undefined,
      taxid: formData.get("taxid") || undefined,
      po: formData.get("po") || undefined,
      terms: formData.get("terms") === "true" || formData.get("terms") === "on"
    });

    if (!parsed.success) {
      return { ok: false, message: formatZodError(parsed.error) };
    }

    const { userId: clerkUserId } = await auth();
    const user = clerkUserId ? await findUserByClerkId(clerkUserId) : null;
    const reg = await submitRegistration(parsed.data, user?.id);

    return {
      ok: true,
      message: `Your registration has been submitted successfully! Reference: ${reg.referenceNumber || reg.id}`
    };
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

export async function submitHansciRegistrationAction(
  payload: any
): Promise<RegistrationActionResult> {
  try {
    const requestHeaders = await headers();
    const ipAddress = getClientIp(requestHeaders);
    enforceRateLimit(`registration-hansci:${ipAddress}`, 5, 60_000);

    const parsed = registrationSchema.safeParse(payload);

    if (!parsed.success) {
      return { ok: false, message: formatZodError(parsed.error) };
    }

    const { userId: clerkUserId } = await auth();
    const user = clerkUserId ? await findUserByClerkId(clerkUserId) : null;
    const reg = await submitRegistration(parsed.data, user?.id);

    return {
      ok: true,
      message: "Registration successfully confirmed!",
      referenceNumber: reg.referenceNumber || reg.id,
      isQuoteRequired: reg.isQuoteRequired,
      totalAmountCents: reg.totalAmountCents
    };
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, message: error.message };
    }

    logger.error("submitHansciRegistrationAction error", {
      metadata: {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      }
    });

    return { ok: false, message: "Failed to process registration. Please check your details and try again." };
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


