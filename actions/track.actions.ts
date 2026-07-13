"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";
import { formatZodError } from "@/lib/validation/format";
import type { ActionState } from "@/actions/contact.actions";

const trackUpsertSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  name: z.string().min(2, "Name must be at least 2 characters."),
  slug: z.string().min(2, "Slug must be at least 2 characters."),
  description: z.string().optional().nullable()
});

export async function upsertTrackAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);

    const rawData = {
      id: formData.get("id") || null,
      name: formData.get("name"),
      slug: formData.get("slug"),
      description: formData.get("description") || null
    };

    const parsed = trackUpsertSchema.safeParse(rawData);
    if (!parsed.success) {
      return { ok: false, message: formatZodError(parsed.error) };
    }

    const conference = await prisma.conference.findFirstOrThrow();

    const data = {
      conferenceId: conference.id,
      name: parsed.data.name,
      slug: parsed.data.slug.toLowerCase(),
      description: parsed.data.description
    };

    if (parsed.data.id) {
      await prisma.track.update({
        where: { id: parsed.data.id },
        data
      });
    } else {
      await prisma.track.create({
        data
      });
    }

    revalidatePath("/admin/tracks");
    revalidatePath("/sessions");
    return { ok: true, message: "Conference Track saved successfully." };
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, message: error.message };
    }
    logger.error("upsertTrackAction error", { metadata: { error: String(error) } });
    return { ok: false, message: "Failed to save track." };
  }
}

export async function deleteTrackAction(trackId: string): Promise<ActionState> {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    await prisma.track.update({
      where: { id: trackId },
      data: { deletedAt: new Date() }
    });
    revalidatePath("/admin/tracks");
    revalidatePath("/sessions");
    return { ok: true, message: "Track deleted successfully." };
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, message: error.message };
    }
    logger.error("deleteTrackAction error", { metadata: { error: String(error) } });
    return { ok: false, message: "Failed to delete track." };
  }
}
