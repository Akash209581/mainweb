"use server";

import { revalidatePath } from "next/cache";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";
import type { ActionState } from "@/actions/contact.actions";

export interface CmsActionState {
  ok: boolean;
  message: string;
  data?: any;
}

// Enforce strict limit on media uploads (50MB)
const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "video/mp4",
  "video/quicktime",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

// Helper: Sanitise string values to prevent basic XSS scripts
function sanitizeValue(val: any): any {
  if (typeof val === "string") {
    return val
      .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
      .replace(/on\w+="[^"]*"/g, "")
      .replace(/javascript:/gi, "");
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeValue);
  }
  if (val && typeof val === "object") {
    const res: Record<string, any> = {};
    for (const key in val) {
      res[key] = sanitizeValue(val[key]);
    }
    return res;
  }
  return val;
}

// 1. Page Content Actions
export async function savePageConfigAction(pageId: string, content: any): Promise<ActionState> {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const sanitized = sanitizeValue(content);
    
    // Check system settings
    const settingKey = `page_content_${pageId}`;
    
    await prisma.systemSetting.upsert({
      where: { conferenceId_key: { conferenceId: null as any, key: settingKey } },
      update: { value: sanitized },
      create: { key: settingKey, value: sanitized }
    });

    // Write Audit Log
    await prisma.auditLog.create({
      data: {
        action: "SAVE_PAGE_DRAFT",
        entity: "PageConfig",
        entityId: pageId,
        metadata: { pageId }
      }
    });

    revalidatePath("/");
    revalidatePath(`/${pageId}`);
    return { ok: true, message: "Draft saved successfully." };
  } catch (error) {
    logger.error("savePageConfigAction error", { metadata: { error: String(error) } });
    return { ok: false, message: error instanceof Error ? error.message : "Failed to save draft." };
  }
}

export async function publishPageConfigAction(pageId: string, content: any): Promise<ActionState> {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const sanitized = sanitizeValue(content);
    
    // Save version history in a dedicated key or list
    const settingKey = `page_content_${pageId}`;
    const historyKey = `page_history_${pageId}`;

    // Get current history list
    const historyRecord = await prisma.systemSetting.findFirst({
      where: { key: historyKey }
    });

    let history: any[] = [];
    if (historyRecord && Array.isArray(historyRecord.value)) {
      history = historyRecord.value;
    }

    // Add current to history (limit to 10 versions)
    history.unshift({
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      value: sanitized
    });
    if (history.length > 10) history.pop();

    await prisma.$transaction([
      prisma.systemSetting.upsert({
        where: { conferenceId_key: { conferenceId: null as any, key: settingKey } },
        update: { value: sanitized },
        create: { key: settingKey, value: sanitized }
      }),
      prisma.systemSetting.upsert({
        where: { conferenceId_key: { conferenceId: null as any, key: historyKey } },
        update: { value: history },
        create: { key: historyKey, value: history }
      })
    ]);

    await prisma.auditLog.create({
      data: {
        action: "PUBLISH_PAGE",
        entity: "PageConfig",
        entityId: pageId,
        metadata: { pageId }
      }
    });

    revalidatePath("/");
    revalidatePath(`/${pageId}`);
    return { ok: true, message: "Page published successfully." };
  } catch (error) {
    logger.error("publishPageConfigAction error", { metadata: { error: String(error) } });
    return { ok: false, message: error instanceof Error ? error.message : "Failed to publish page." };
  }
}

export async function rollbackPageConfigAction(pageId: string, versionId: string): Promise<CmsActionState> {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const historyKey = `page_history_${pageId}`;
    const settingKey = `page_content_${pageId}`;

    const historyRecord = await prisma.systemSetting.findFirst({
      where: { key: historyKey }
    });

    const historyList = (historyRecord?.value as any[]) || [];
    if (!Array.isArray(historyList)) {
      return { ok: false, message: "No version history found." };
    }

    const version = historyList.find((v: any) => v.id === versionId);
    if (!version) {
      return { ok: false, message: "Specified version not found." };
    }

    await prisma.systemSetting.upsert({
      where: { conferenceId_key: { conferenceId: null as any, key: settingKey } },
      update: { value: version.value },
      create: { key: settingKey, value: version.value }
    });

    await prisma.auditLog.create({
      data: {
        action: "ROLLBACK_PAGE",
        entity: "PageConfig",
        entityId: pageId,
        metadata: { pageId, versionId }
      }
    });

    revalidatePath("/");
    revalidatePath(`/${pageId}`);
    return { ok: true, message: "Rolled back to selected version successfully." };
  } catch (error) {
    logger.error("rollbackPageConfigAction error", { metadata: { error: String(error) } });
    return { ok: false, message: "Failed to rollback version." };
  }
}

// 2. Theme Designer Actions
export async function saveActiveThemeAction(name: string, tokens: any): Promise<ActionState> {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    
    // Set other themes to inactive
    await prisma.$transaction([
      prisma.themeSetting.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      }),
      prisma.themeSetting.upsert({
        where: { conferenceId_name: { conferenceId: null as any, name } },
        update: { tokens: tokens as any, isActive: true },
        create: { name, tokens: tokens as any, isActive: true }
      })
    ]);

    await prisma.auditLog.create({
      data: {
        action: "UPDATE_THEME",
        entity: "ThemeSetting",
        entityId: name,
        metadata: { themeName: name }
      }
    });

    revalidatePath("/", "layout");
    return { ok: true, message: "Theme saved and activated successfully." };
  } catch (error) {
    logger.error("saveActiveThemeAction error", { metadata: { error: String(error) } });
    return { ok: false, message: "Failed to update theme configuration." };
  }
}

// 3. Navigation Builder Actions
export async function saveNavigationAction(menuItems: any): Promise<ActionState> {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const sanitized = sanitizeValue(menuItems);

    await prisma.systemSetting.upsert({
      where: { conferenceId_key: { conferenceId: null as any, key: "navigation_menu" } },
      update: { value: sanitized },
      create: { key: "navigation_menu", value: sanitized }
    });

    await prisma.auditLog.create({
      data: {
        action: "UPDATE_NAVIGATION",
        entity: "NavigationMenu",
        metadata: { itemsCount: sanitized?.length || 0 }
      }
    });

    revalidatePath("/", "layout");
    return { ok: true, message: "Navigation menu saved successfully." };
  } catch (error) {
    logger.error("saveNavigationAction error", { metadata: { error: String(error) } });
    return { ok: false, message: "Failed to save navigation menu." };
  }
}

// 4. General Settings & Configuration Actions
export async function saveSystemSettingAction(key: string, value: any): Promise<ActionState> {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const sanitized = sanitizeValue(value);

    await prisma.systemSetting.upsert({
      where: { conferenceId_key: { conferenceId: null as any, key } },
      update: { value: sanitized },
      create: { key, value: sanitized }
    });

    await prisma.auditLog.create({
      data: {
        action: `UPDATE_SETTING_${key.toUpperCase()}`,
        entity: "SystemSetting",
        entityId: key
      }
    });

    revalidatePath("/");
    revalidatePath("/registration");
    revalidatePath("/abstracts");
    return { ok: true, message: "Settings saved successfully." };
  } catch (error) {
    logger.error("saveSystemSettingAction error", { metadata: { error: String(error) } });
    return { ok: false, message: "Failed to save settings." };
  }
}

// 5. Media Library Actions
export async function uploadMediaAction(_prevState: any, formData: FormData): Promise<CmsActionState> {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    
    const file = formData.get("file") as File;
    if (!file || file.size === 0) {
      return { ok: false, message: "No file was selected for upload." };
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      return { ok: false, message: "File exceeds max size limit of 50MB." };
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return { ok: false, message: `Unsupported file type: ${file.type}` };
    }

    // Duplicate detection check
    const existingFile = await prisma.fileAsset.findFirst({
      where: {
        originalName: file.name,
        sizeBytes: file.size,
        deletedAt: null
      }
    });

    if (existingFile) {
      return { ok: true, message: "File already uploaded.", data: existingFile };
    }

    // Save to public resources folder for web access
    const resourcesDir = path.join(process.cwd(), "public", "resources");
    await mkdir(resourcesDir, { recursive: true });

    const fileExt = path.extname(file.name).toLowerCase();
    const storageKey = `${randomUUID()}${fileExt}`;
    const destinationPath = path.join(resourcesDir, storageKey);

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await writeFile(destinationPath, fileBuffer);

    // Save asset inside database
    const fileAsset = await prisma.fileAsset.create({
      data: {
        storageProvider: "local_public",
        storageKey: `/resources/${storageKey}`,
        originalName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        visibility: "PUBLIC"
      }
    });

    // Write to audit log
    await prisma.auditLog.create({
      data: {
        action: "UPLOAD_MEDIA",
        entity: "FileAsset",
        entityId: fileAsset.id,
        metadata: { filename: file.name, size: file.size }
      }
    });

    return { ok: true, message: "File uploaded successfully.", data: fileAsset };
  } catch (error) {
    logger.error("uploadMediaAction error", { metadata: { error: String(error) } });
    return { ok: false, message: "An error occurred during file upload." };
  }
}

export async function deleteMediaAction(id: string): Promise<ActionState> {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);

    const fileAsset = await prisma.fileAsset.findUnique({
      where: { id }
    });

    if (!fileAsset) {
      return { ok: false, message: "File asset not found." };
    }

    // Soft delete file asset
    await prisma.fileAsset.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    // Delete absolute file on disk
    if (fileAsset.storageProvider === "local_public") {
      const diskPath = path.join(process.cwd(), "public", fileAsset.storageKey);
      try {
        await unlink(diskPath);
      } catch (err) {
        logger.warn(`Could not delete file from disk: ${diskPath}`, { metadata: { err: String(err) } });
      }
    }

    // Write to audit log
    await prisma.auditLog.create({
      data: {
        action: "DELETE_MEDIA",
        entity: "FileAsset",
        entityId: id,
        metadata: { originalName: fileAsset.originalName }
      }
    });

    return { ok: true, message: "File asset deleted successfully." };
  } catch (error) {
    logger.error("deleteMediaAction error", { metadata: { error: String(error) } });
    return { ok: false, message: "Failed to delete file asset." };
  }
}

// 6. Registration Package CRUD Actions
export async function upsertRegistrationPackageAction(
  id: string | null,
  data: { name: string; description: string; priceCents: number; attendanceMode: "ONSITE" | "VIRTUAL" }
): Promise<ActionState> {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    
    const conference = await prisma.conference.findFirstOrThrow();

    const packageData = {
      conferenceId: conference.id,
      name: data.name,
      description: data.description,
      priceCents: data.priceCents,
      attendanceMode: data.attendanceMode
    };

    if (id) {
      await prisma.registrationPackage.update({
        where: { id },
        data: packageData
      });
    } else {
      await prisma.registrationPackage.create({
        data: packageData
      });
    }

    await prisma.auditLog.create({
      data: {
        action: id ? "UPDATE_REGISTRATION_PACKAGE" : "CREATE_REGISTRATION_PACKAGE",
        entity: "RegistrationPackage",
        entityId: id || undefined,
        metadata: { name: data.name, price: data.priceCents }
      }
    });

    revalidatePath("/registration");
    revalidatePath("/admin/settings");
    return { ok: true, message: "Registration package saved successfully." };
  } catch (error) {
    logger.error("upsertRegistrationPackageAction error", { metadata: { error: String(error) } });
    return { ok: false, message: "Failed to save registration package." };
  }
}

export async function deleteRegistrationPackageAction(id: string): Promise<ActionState> {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);

    await prisma.registrationPackage.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    await prisma.auditLog.create({
      data: {
        action: "DELETE_REGISTRATION_PACKAGE",
        entity: "RegistrationPackage",
        entityId: id
      }
    });

    revalidatePath("/registration");
    revalidatePath("/admin/settings");
    return { ok: true, message: "Registration package deleted successfully." };
  } catch (error) {
    logger.error("deleteRegistrationPackageAction error", { metadata: { error: String(error) } });
    return { ok: false, message: "Failed to delete registration package." };
  }
}
