"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma/client";
import { requireAuthenticatedUser } from "@/lib/auth/rbac";
import { AppError, NotFoundError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";
import type { ActionState } from "@/actions/contact.actions";

export async function markNotificationReadAction(
  notificationId: string
): Promise<ActionState> {
  try {
    const user = await requireAuthenticatedUser();

    const notif = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notif || notif.userId !== user.id) {
      throw new NotFoundError("Notification not found or access denied.");
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { status: "READ" }
    });

    revalidatePath("/");
    return { ok: true, message: "Notification marked as read." };
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, message: error.message };
    }
    logger.error("markNotificationReadAction error", { metadata: { error: String(error) } });
    return { ok: false, message: "Failed to update notification." };
  }
}
