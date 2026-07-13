import { createContactMessage } from "@/lib/repositories/write.repository";
import { emailService } from "@/lib/services/email.service";
import type { ContactInput } from "@/lib/validation/schemas";

export async function submitContactMessage(
  input: ContactInput,
  context: { ipAddress?: string; userAgent?: string }
) {
  const message = await createContactMessage(input, context);
  await emailService.sendContactAcknowledgement(input.email, input.name);
  return message;
}
