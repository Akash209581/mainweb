"use server";

import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";
import { enforceRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { submitAbstract } from "@/lib/services/abstract.service";
import { formatZodError } from "@/lib/validation/format";
import { abstractSubmissionSchema } from "@/lib/validation/schemas";
import { emailService } from "@/lib/services/email.service";
import type { ActionState } from "@/actions/contact.actions";
import type { SubmissionStatus } from "@prisma/client";

export async function submitAbstractAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const requestHeaders = await headers();
    const ipAddress = getClientIp(requestHeaders);
    enforceRateLimit(`abstract:${ipAddress}`, 5, 60_000);

    const keywords = String(formData.get("keywords") ?? "")
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean);

    const parsed = abstractSubmissionSchema.safeParse({
      conferenceSlug: formData.get("conferenceSlug") ?? "icgit-2026",
      trackId: formData.get("trackId") || undefined,
      title: formData.get("title"),
      abstractText: formData.get("abstractText"),
      keywords,
      fileAssetId: formData.get("fileAssetId") || undefined
    });

    if (!parsed.success) {
      return { ok: false, message: formatZodError(parsed.error) };
    }

    const { userId } = await auth();
    await submitAbstract(parsed.data, userId);

    return { ok: true, message: "Your abstract has been submitted." };
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, message: error.message };
    }

    logger.error("submitAbstractAction unexpected error", {
      metadata: {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      }
    });

    return { ok: false, message: "An unexpected error occurred. Please try again later." };
  }
}

export async function assignAbstractReviewerAction(
  abstractId: string,
  reviewerId: string
): Promise<ActionState> {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN", "COMMITTEE_MEMBER"]);

    await prisma.reviewerAssignment.upsert({
      where: {
        reviewerId_abstractSubmissionId: {
          reviewerId,
          abstractSubmissionId: abstractId
        }
      },
      update: { deletedAt: null },
      create: {
        reviewerId,
        abstractSubmissionId: abstractId
      }
    });

    revalidatePath("/committee/manage");
    return { ok: true, message: "Reviewer assigned successfully." };
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, message: error.message };
    }
    logger.error("assignAbstractReviewerAction error", { metadata: { error: String(error) } });
    return { ok: false, message: "Failed to assign reviewer." };
  }
}

export async function updateAbstractStatusAction(
  abstractId: string,
  status: SubmissionStatus
): Promise<ActionState> {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN", "COMMITTEE_MEMBER"]);

    const abstract = await prisma.abstractSubmission.update({
      where: { id: abstractId },
      data: { status },
      include: { author: true }
    });

    if (status === "ACCEPTED" && abstract.author.email) {
      try {
        await emailService.sendAcceptanceNotification(abstract.author.email, abstract.title);
      } catch (emailErr) {
        logger.error("Failed to send acceptance notification email", { metadata: { error: String(emailErr) } });
      }
    }

    revalidatePath("/committee/manage");
    return { ok: true, message: `Abstract status updated to ${status.replace("_", " ")}.` };
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, message: error.message };
    }
    logger.error("updateAbstractStatusAction error", { metadata: { error: String(error) } });
    return { ok: false, message: "Failed to update abstract status." };
  }
}


