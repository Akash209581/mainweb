import type { AbstractSubmissionInput, ContactInput, RegistrationInput } from "@/lib/validation/schemas";
import type { FileVisibility } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
import { NotFoundError } from "@/lib/errors/app-error";


export async function createContactMessage(
  input: ContactInput,
  context: { ipAddress?: string; userAgent?: string }
) {
  return prisma.contactMessage.create({
    data: {
      ...input,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    }
  });
}

export async function createRegistration(input: RegistrationInput, userId?: string) {
  return prisma.$transaction(async (tx) => {
    const conference = await tx.conference.findUnique({
      where: { slug: input.conferenceSlug }
    });
    if (!conference) {
      throw new NotFoundError("Conference not found.");
    }

    const registration = await tx.registration.create({
      data: {
        conferenceId: conference.id,
        userId,
        registrationPackageId: input.packageId,
        fullName: input.fullName,
        email: input.email,
        organization: input.organization,
        countryId: input.countryId,
        status: "PENDING"
      }
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: "registration.created",
        entity: "Registration",
        entityId: registration.id
      }
    });

    return registration;
  });
}

export async function createAbstractSubmission(input: AbstractSubmissionInput, authorId: string) {
  return prisma.$transaction(async (tx) => {
    const conference = await tx.conference.findUnique({
      where: { slug: input.conferenceSlug }
    });
    if (!conference) {
      throw new NotFoundError("Conference not found.");
    }

    const submission = await tx.abstractSubmission.create({
      data: {
        conferenceId: conference.id,
        authorId,
        trackId: input.trackId,
        title: input.title,
        abstractText: input.abstractText,
        keywords: input.keywords,
        status: "SUBMITTED"
      }
    });

    if (input.fileAssetId) {
      await tx.fileAsset.update({
        where: { id: input.fileAssetId },
        data: { abstractSubmissionId: submission.id }
      });
    }

    await tx.auditLog.create({
      data: {
        userId: authorId,
        action: "abstract.submitted",
        entity: "AbstractSubmission",
        entityId: submission.id
      }
    });

    return submission;
  });
}

export async function createFileAsset(data: {
  ownerId?: string;
  storageProvider: string;
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  visibility?: FileVisibility;
  abstractSubmissionId?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const fileAsset = await tx.fileAsset.create({
      data: {
        ownerId: data.ownerId,
        abstractSubmissionId: data.abstractSubmissionId,
        storageProvider: data.storageProvider,
        storageKey: data.storageKey,
        originalName: data.originalName,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        visibility: data.visibility ?? "PRIVATE"
      }
    });

    await tx.auditLog.create({
      data: {
        userId: data.ownerId,
        action: "file.uploaded",
        entity: "FileAsset",
        entityId: fileAsset.id,
        metadata: {
          originalName: data.originalName,
          sizeBytes: data.sizeBytes,
          storageKey: data.storageKey
        }
      }
    });

    return fileAsset;
  });
}

