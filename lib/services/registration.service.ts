import { createRegistration } from "@/lib/repositories/write.repository";
import { emailService } from "@/lib/services/email.service";
import type { RegistrationInput } from "@/lib/validation/schemas";

export async function submitRegistration(input: RegistrationInput, userId?: string) {
  const registration = await createRegistration(input, userId);
  const displayName = (input.fullName || `${input.first || ""} ${input.last || ""}`).trim() || "Participant";
  try {
    await emailService.sendRegistrationConfirmation(input.email, displayName);
  } catch (err) {
    console.warn("Failed to send email confirmation:", err);
  }
  return registration;
}
