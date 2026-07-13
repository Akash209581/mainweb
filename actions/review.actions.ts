"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { AppError, NotFoundError, AuthorizationError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";
import { formatZodError } from "@/lib/validation/format";
import type { ActionState } from "@/actions/contact.actions";
import type { ReviewRecommendation } from "@prisma/client";

const reviewSchema = z.object({
  assignmentId: z.string().uuid("Invalid assignment identification."),
  technicalRigor: z.coerce.number().min(1).max(5),
  originality: z.coerce.number().min(1).max(5),
  clarity: z.coerce.number().min(1).max(5),
  recommendation: z.enum(["ACCEPT", "MINOR_REVISION", "MAJOR_REVISION", "REJECT"]),
  comments: z.string().min(10, "Comments must be at least 10 characters long.")
});

export async function submitPaperReviewAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireRole(["REVIEWER", "ADMIN", "SUPER_ADMIN"]);

    const rawData = {
      assignmentId: formData.get("assignmentId"),
      technicalRigor: formData.get("technicalRigor"),
      originality: formData.get("originality"),
      clarity: formData.get("clarity"),
      recommendation: formData.get("recommendation"),
      comments: formData.get("comments")
    };

    const parsed = reviewSchema.safeParse(rawData);
    if (!parsed.success) {
      return { ok: false, message: formatZodError(parsed.error) };
    }

    // Load assignment and verify reviewer ID
    const assignment = await prisma.reviewerAssignment.findUnique({
      where: { id: parsed.data.assignmentId },
      include: { abstractSubmission: true }
    });

    if (!assignment || assignment.deletedAt) {
      throw new NotFoundError("Assignment record not found or has been deleted.");
    }

    if (assignment.reviewerId !== user.id) {
      throw new AuthorizationError("You are not authorized to submit a review for this assignment.");
    }

    await prisma.$transaction(async (tx) => {
      // 1. Create Review
      const review = await tx.review.create({
        data: {
          reviewerId: user.id,
          abstractSubmissionId: assignment.abstractSubmissionId,
          assignmentId: assignment.id,
          recommendation: parsed.data.recommendation as ReviewRecommendation,
          comments: parsed.data.comments
        }
      });

      // 2. Create scores
      await tx.reviewScore.createMany({
        data: [
          { reviewId: review.id, criterion: "Technical Rigor", score: parsed.data.technicalRigor },
          { reviewId: review.id, criterion: "Originality", score: parsed.data.originality },
          { reviewId: review.id, criterion: "Clarity", score: parsed.data.clarity }
        ]
      });

      // 3. Mark assignment completed
      await tx.reviewerAssignment.update({
        where: { id: assignment.id },
        data: { completedAt: new Date() }
      });
      
      // 4. Update abstract status to UNDER_REVIEW if it is currently SUBMITTED
      if (assignment.abstractSubmission.status === "SUBMITTED") {
        await tx.abstractSubmission.update({
          where: { id: assignment.abstractSubmissionId },
          data: { status: "UNDER_REVIEW" }
        });
      }
    });

    revalidatePath("/reviewer");
    revalidatePath("/committee/manage");
    return { ok: true, message: "Your review has been successfully submitted." };
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, message: error.message };
    }
    logger.error("submitPaperReviewAction error", { metadata: { error: String(error) } });
    return { ok: false, message: "Failed to submit review." };
  }
}
