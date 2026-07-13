"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/rbac";
import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";
import { softDeleteUser, restoreUser, updateUserRole } from "@/lib/repositories/user.repository";
import type { ActionState } from "@/actions/contact.actions";
import type { RoleName } from "@prisma/client";

export async function updateUserRoleAction(
  userId: string,
  roleName: RoleName
): Promise<ActionState> {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    await updateUserRole(userId, roleName);
    revalidatePath("/admin/users");
    return { ok: true, message: "User role updated successfully." };
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, message: error.message };
    }
    logger.error("updateUserRoleAction error", { metadata: { error: String(error) } });
    return { ok: false, message: "Failed to update user role." };
  }
}

export async function deleteUserAction(userId: string): Promise<ActionState> {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    await softDeleteUser(userId);
    revalidatePath("/admin/users");
    return { ok: true, message: "User deleted successfully." };
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, message: error.message };
    }
    logger.error("deleteUserAction error", { metadata: { error: String(error) } });
    return { ok: false, message: "Failed to delete user." };
  }
}

export async function restoreUserAction(userId: string): Promise<ActionState> {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    await restoreUser(userId);
    revalidatePath("/admin/users");
    return { ok: true, message: "User restored successfully." };
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, message: error.message };
    }
    logger.error("restoreUserAction error", { metadata: { error: String(error) } });
    return { ok: false, message: "Failed to restore user." };
  }
}
