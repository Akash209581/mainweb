import { auth } from "@/lib/auth/server";
import { fail, ok } from "@/lib/api/response";
import { AuthenticationError, ValidationError } from "@/lib/errors/app-error";
import { findUserByClerkId } from "@/lib/repositories/user.repository";
import { enforceRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { uploadFile } from "@/lib/services/storage.service";
import type { FileVisibility } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ipAddress = getClientIp(request.headers);
    enforceRateLimit(`api-upload:${ipAddress}`, 10, 60_000);

    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      throw new AuthenticationError();
    }

    const user = await findUserByClerkId(clerkUserId);
    if (!user) {
      throw new AuthenticationError("Authenticated user is not synchronized.");
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      throw new ValidationError("No file uploaded or file is invalid.");
    }

    const visibilityInput = formData.get("visibility");
    let visibility: FileVisibility = "PRIVATE";
    if (visibilityInput === "PUBLIC" || visibilityInput === "PROTECTED" || visibilityInput === "PRIVATE") {
      visibility = visibilityInput as FileVisibility;
    }

    const abstractSubmissionId = formData.get("abstractSubmissionId") as string | undefined;

    const fileAsset = await uploadFile(file, user.id, visibility, abstractSubmissionId || undefined);

    return ok({
      id: fileAsset.id,
      storageKey: fileAsset.storageKey,
      originalName: fileAsset.originalName,
      mimeType: fileAsset.mimeType,
      sizeBytes: fileAsset.sizeBytes,
      visibility: fileAsset.visibility
    }, 201);
  } catch (error) {
    return fail(error);
  }
}
