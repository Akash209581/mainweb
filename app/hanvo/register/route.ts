import { auth } from "@/lib/auth/server";
import { fail, ok } from "@/lib/api/response";
import { findUserByClerkId } from "@/lib/repositories/user.repository";
import { enforceRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { submitRegistration } from "@/lib/services/registration.service";
import { registrationSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const ipAddress = getClientIp(request.headers);
    enforceRateLimit(`api-registration:${ipAddress}`, 5, 60_000);
    const input = registrationSchema.parse(await request.json());
    const { userId: clerkUserId } = await auth();
    const user = clerkUserId ? await findUserByClerkId(clerkUserId) : null;
    const registration = await submitRegistration(input, user?.id);
    return ok({ id: registration.id, status: registration.status }, 201);
  } catch (error) {
    return fail(error);
  }
}
