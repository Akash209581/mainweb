import { auth } from "@/lib/auth/server";
import { fail, ok } from "@/lib/api/response";
import { AuthenticationError } from "@/lib/errors/app-error";
import { enforceRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { updateUserProfile } from "@/lib/repositories/user.repository";
import { profileUpdateSchema } from "@/lib/validation/schemas";

export async function PATCH(request: Request) {
  try {
    const ipAddress = getClientIp(request.headers);
    enforceRateLimit(`api-profile:${ipAddress}`, 10, 60_000);

    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    const input = profileUpdateSchema.parse(await request.json());
    const profile = await updateUserProfile(userId, {
      title: input.title,
      designation: input.designation,
      phone: input.phone,
      bio: input.bio,
      country: input.countryId ? { connect: { id: input.countryId } } : undefined
    });

    return ok({ id: profile?.id });
  } catch (error) {
    return fail(error);
  }
}

