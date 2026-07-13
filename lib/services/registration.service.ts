import { createRegistration } from "@/lib/repositories/write.repository";
import { emailService } from "@/lib/services/email.service";
import type { RegistrationInput } from "@/lib/validation/schemas";

export async function submitRegistration(input: RegistrationInput, userId?: string) {
  const registration = await createRegistration(input, userId);
  await emailService.sendRegistrationConfirmation(input.email, input.fullName);
  return registration;
}
