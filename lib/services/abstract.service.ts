import { AuthenticationError } from "@/lib/errors/app-error";
import { findUserByClerkId } from "@/lib/repositories/user.repository";
import { createAbstractSubmission } from "@/lib/repositories/write.repository";
import { emailService } from "@/lib/services/email.service";
import type { AbstractSubmissionInput } from "@/lib/validation/schemas";

export async function submitAbstract(input: AbstractSubmissionInput, clerkUserId?: string | null) {
  if (!clerkUserId) {
    throw new AuthenticationError();
  }

  const user = await findUserByClerkId(clerkUserId);
  if (!user) {
    throw new AuthenticationError("Authenticated user has not been synchronized.");
  }

  const submission = await createAbstractSubmission(input, user.id);
  await emailService.sendAbstractConfirmation(user.email, input.title);
  return submission;
}
