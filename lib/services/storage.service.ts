import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { FileVisibility } from "@prisma/client";
import { getServerEnv } from "@/lib/config/env";
import { ValidationError } from "@/lib/errors/app-error";
import { createFileAsset } from "@/lib/repositories/write.repository";


export interface StoredFile {
  storageProvider: string;
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface StorageProvider {
  save(file: File): Promise<StoredFile>;
}

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"
]);

const maxFileSizeBytes = 20 * 1024 * 1024;

class LocalStorageProvider implements StorageProvider {
  constructor(private readonly basePath: string) {}

  async save(file: File): Promise<StoredFile> {
    validateUpload(file);
    const extension = path.extname(file.name).toLowerCase();
    const storageKey = `${randomUUID()}${extension}`;
    const destination = path.join(this.basePath, storageKey);
    await mkdir(this.basePath, { recursive: true });
    await writeFile(destination, Buffer.from(await file.arrayBuffer()));

    return {
      storageProvider: "local",
      storageKey,
      originalName: file.name,
      mimeType: file.type,
      sizeBytes: file.size
    };
  }
}

export function validateUpload(file: File): void {
  if (!allowedMimeTypes.has(file.type)) {
    throw new ValidationError("Only PDF, DOCX, and PPTX files are supported.");
  }

  if (file.size > maxFileSizeBytes) {
    throw new ValidationError("Files must not exceed 20 MB.");
  }
}

export function getStorageProvider(): StorageProvider {
  const env = getServerEnv();
  if (env.STORAGE_PROVIDER !== "local") {
    throw new ValidationError("Configured storage provider is not implemented yet.");
  }
  return new LocalStorageProvider(env.LOCAL_STORAGE_PATH);
}

export async function uploadFile(
  file: File,
  ownerId?: string,
  visibility?: FileVisibility,
  abstractSubmissionId?: string
) {
  const provider = getStorageProvider();
  const stored = await provider.save(file);

  return createFileAsset({
    ownerId,
    abstractSubmissionId,
    storageProvider: stored.storageProvider,
    storageKey: stored.storageKey,
    originalName: stored.originalName,
    mimeType: stored.mimeType,
    sizeBytes: stored.sizeBytes,
    visibility
  });
}

