"use server";

import { auth } from "@/lib/auth/server";
import { AppError, AuthenticationError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";
import { updateUserProfile } from "@/lib/repositories/user.repository";
import { formatZodError } from "@/lib/validation/format";
import { profileUpdateSchema } from "@/lib/validation/schemas";
import type { ActionState } from "@/actions/contact.actions";

export async function updateProfileAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    const parsed = profileUpdateSchema.safeParse({
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      title: formData.get("title") || undefined,
      designation: formData.get("designation") || undefined,
      phone: formData.get("phone") || undefined,
      bio: formData.get("bio") || undefined,
      countryId: formData.get("countryId") || undefined,
      organizationName: formData.get("organizationName") || undefined
    });

    if (!parsed.success) {
      return { ok: false, message: formatZodError(parsed.error) };
    }

    await updateUserProfile(userId, {
      title: parsed.data.title,
      designation: parsed.data.designation,
      phone: parsed.data.phone,
      bio: parsed.data.bio,
      country: parsed.data.countryId ? { connect: { id: parsed.data.countryId } } : undefined
    });

    return { ok: true, message: "Your profile has been updated." };
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, message: error.message };
    }

    logger.error("updateProfileAction unexpected error", {
      metadata: {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      }
    });

    return { ok: false, message: "An unexpected error occurred. Please try again later." };
  }
}

