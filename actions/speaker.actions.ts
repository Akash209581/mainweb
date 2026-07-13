"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";
import { formatZodError } from "@/lib/validation/format";
import type { ActionState } from "@/actions/contact.actions";

const speakerUpsertSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  name: z.string().min(2, "Name must be at least 2 characters."),
  role: z.string().min(2, "Role must be at least 2 characters."),
  topic: z.string().min(2, "Topic must be at least 2 characters."),
  bio: z.string().optional().nullable(),
  organizationId: z.string().uuid().optional().nullable(),
  sortOrder: z.coerce.number().default(0),
  isFeatured: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(false),
  imageAssetId: z.string().uuid().optional().nullable()
});

export async function upsertSpeakerAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);

    const rawData = {
      id: formData.get("id") || null,
      name: formData.get("name"),
      role: formData.get("role"),
      topic: formData.get("topic"),
      bio: formData.get("bio") || null,
      organizationId: formData.get("organizationId") || null,
      sortOrder: formData.get("sortOrder"),
      isFeatured: formData.get("isFeatured") === "true",
      imageAssetId: formData.get("imageAssetId") || null
    };

    const parsed = speakerUpsertSchema.safeParse(rawData);
    if (!parsed.success) {
      return { ok: false, message: formatZodError(parsed.error) };
    }

    const conference = await prisma.conference.findFirstOrThrow();

    const data = {
      conferenceId: conference.id,
      name: parsed.data.name,
      role: parsed.data.role,
      topic: parsed.data.topic,
      bio: parsed.data.bio,
      organizationId: parsed.data.organizationId,
      sortOrder: parsed.data.sortOrder,
      isFeatured: parsed.data.isFeatured,
      imageAssetId: parsed.data.imageAssetId
    };

    if (parsed.data.id) {
      await prisma.speaker.update({
        where: { id: parsed.data.id },
        data
      });
    } else {
      await prisma.speaker.create({
        data
      });
    }

    revalidatePath("/admin/speakers");
    revalidatePath("/speakers");
    return { ok: true, message: "Speaker saved successfully." };
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, message: error.message };
    }
    logger.error("upsertSpeakerAction error", { metadata: { error: String(error) } });
    return { ok: false, message: "Failed to save speaker details." };
  }
}

export async function deleteSpeakerAction(speakerId: string): Promise<ActionState> {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    await prisma.speaker.update({
      where: { id: speakerId },
      data: { deletedAt: new Date() }
    });
    revalidatePath("/admin/speakers");
    revalidatePath("/speakers");
    return { ok: true, message: "Speaker deleted successfully." };
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, message: error.message };
    }
    logger.error("deleteSpeakerAction error", { metadata: { error: String(error) } });
    return { ok: false, message: "Failed to delete speaker." };
  }
}
