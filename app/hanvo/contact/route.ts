import { fail, ok } from "@/lib/api/response";
import { enforceRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { submitContactMessage } from "@/lib/services/contact.service";
import { contactSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const ipAddress = getClientIp(request.headers);
    enforceRateLimit(`api-contact:${ipAddress}`, 3, 60_000);
    const input = contactSchema.parse(await request.json());
    const message = await submitContactMessage(input, {
      ipAddress,
      userAgent: request.headers.get("user-agent") ?? undefined
    });
    return ok({ id: message.id }, 201);
  } catch (error) {
    return fail(error);
  }
}
