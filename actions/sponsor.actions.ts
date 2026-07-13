"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";
import { formatZodError } from "@/lib/validation/format";
import type { ActionState } from "@/actions/contact.actions";

const sponsorUpsertSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  name: z.string().min(2, "Name must be at least 2 characters."),
  focus: z.string().min(2, "Focus must be at least 2 characters."),
  website: z.string().url("Must be a valid website URL.").optional().nullable().or(z.literal("")),
  sponsorTierId: z.string().uuid("Please select a valid tier."),
  organizationId: z.string().uuid().optional().nullable(),
  logoAssetId: z.string().uuid().optional().nullable(),
  sortOrder: z.coerce.number().default(0)
});

export async function upsertSponsorAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);

    const rawData = {
      id: formData.get("id") || null,
      name: formData.get("name"),
      focus: formData.get("focus"),
      website: formData.get("website") || null,
      sponsorTierId: formData.get("sponsorTierId"),
      organizationId: formData.get("organizationId") || null,
      logoAssetId: formData.get("logoAssetId") || null,
      sortOrder: formData.get("sortOrder")
    };

    const parsed = sponsorUpsertSchema.safeParse(rawData);
    if (!parsed.success) {
      return { ok: false, message: formatZodError(parsed.error) };
    }

    const conference = await prisma.conference.findFirstOrThrow();

    const data = {
      conferenceId: conference.id,
      name: parsed.data.name,
      focus: parsed.data.focus,
      website: parsed.data.website || null,
      sponsorTierId: parsed.data.sponsorTierId,
      organizationId: parsed.data.organizationId,
      logoAssetId: parsed.data.logoAssetId,
      sortOrder: parsed.data.sortOrder
    };

    if (parsed.data.id) {
      await prisma.sponsor.update({
        where: { id: parsed.data.id },
        data
      });
    } else {
      await prisma.sponsor.create({
        data
      });
    }

    revalidatePath("/admin/sponsors");
    revalidatePath("/sponsors");
    return { ok: true, message: "Sponsor details saved successfully." };
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, message: error.message };
    }
    logger.error("upsertSponsorAction error", { metadata: { error: String(error) } });
    return { ok: false, message: "Failed to save sponsor details." };
  }
}

export async function deleteSponsorAction(sponsorId: string): Promise<ActionState> {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    await prisma.sponsor.update({
      where: { id: sponsorId },
      data: { deletedAt: new Date() }
    });
    revalidatePath("/admin/sponsors");
    revalidatePath("/sponsors");
    return { ok: true, message: "Sponsor deleted successfully." };
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, message: error.message };
    }
    logger.error("deleteSponsorAction error", { metadata: { error: String(error) } });
    return { ok: false, message: "Failed to delete sponsor." };
  }
}
