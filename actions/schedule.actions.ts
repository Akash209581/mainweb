"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";
import { formatZodError } from "@/lib/validation/format";
import type { ActionState } from "@/actions/contact.actions";

const agendaItemUpsertSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  agendaDayId: z.string().uuid("Please select a valid day."),
  title: z.string().min(2, "Title must be at least 2 characters."),
  description: z.string().optional().nullable(),
  startsAt: z.string().transform((val) => new Date(val)),
  endsAt: z.string().transform((val) => new Date(val)),
  location: z.string().optional().nullable(),
  sortOrder: z.coerce.number().default(0)
});

export async function upsertAgendaItemAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);

    const rawData = {
      id: formData.get("id") || null,
      agendaDayId: formData.get("agendaDayId"),
      title: formData.get("title"),
      description: formData.get("description") || null,
      startsAt: formData.get("startsAt"),
      endsAt: formData.get("endsAt"),
      location: formData.get("location") || null,
      sortOrder: formData.get("sortOrder")
    };

    const parsed = agendaItemUpsertSchema.safeParse(rawData);
    if (!parsed.success) {
      return { ok: false, message: formatZodError(parsed.error) };
    }

    const data = {
      agendaDayId: parsed.data.agendaDayId,
      title: parsed.data.title,
      description: parsed.data.description,
      startsAt: parsed.data.startsAt,
      endsAt: parsed.data.endsAt,
      location: parsed.data.location,
      sortOrder: parsed.data.sortOrder
    };

    if (parsed.data.id) {
      await prisma.agendaItem.update({
        where: { id: parsed.data.id },
        data
      });
    } else {
      await prisma.agendaItem.create({
        data
      });
    }

    revalidatePath("/admin/schedule");
    revalidatePath("/schedule");
    return { ok: true, message: "Agenda Item saved successfully." };
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, message: error.message };
    }
    logger.error("upsertAgendaItemAction error", { metadata: { error: String(error) } });
    return { ok: false, message: "Failed to save agenda item." };
  }
}

export async function deleteAgendaItemAction(itemId: string): Promise<ActionState> {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    await prisma.agendaItem.update({
      where: { id: itemId },
      data: { deletedAt: new Date() }
    });
    revalidatePath("/admin/schedule");
    revalidatePath("/schedule");
    return { ok: true, message: "Agenda item deleted successfully." };
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, message: error.message };
    }
    logger.error("deleteAgendaItemAction error", { metadata: { error: String(error) } });
    return { ok: false, message: "Failed to delete agenda item." };
  }
}
