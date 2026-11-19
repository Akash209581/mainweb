import { createRegistration } from "@/lib/repositories/write.repository";
import { emailService } from "@/lib/services/email.service";
import type { RegistrationInput } from "@/lib/validation/schemas";
import { guestCapability, hashCapability } from "@/lib/security/checkout";

export async function submitRegistration(input: RegistrationInput, userId?: string) {
  const capability = await guestCapability(true);
  const registration = await createRegistration(input, userId, hashCapability(capability));
  const displayName = (input.fullName || `${input.first || ""} ${input.last || ""}`).trim() || "Participant";
  try {
    await emailService.sendRegistrationConfirmation(input.email, displayName);
  } catch {
    console.warn("Registration acknowledgement delivery failed.");
  }
  return registration;
}
