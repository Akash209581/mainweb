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

import { DEFAULT_PACKAGES, DEFAULT_COUNTRIES } from "@/constants/conference";

export async function createRegistration(input: RegistrationInput, userId?: string) {
  return prisma.$transaction(async (tx) => {
    let conference = await tx.conference.findUnique({
      where: { slug: input.conferenceSlug }
    });
    if (!conference) {
      conference = await tx.conference.findFirst({
        where: { deletedAt: null }
      });
    }
    if (!conference) {
      throw new NotFoundError("Conference not found.");
    }

    // Ensure package exists in DB (auto-upsert fallback if needed)
    const pkgExists = await tx.registrationPackage.findUnique({
      where: { id: input.packageId }
    });
    if (!pkgExists) {
      const fallbackPkg = DEFAULT_PACKAGES.find((p) => p.id === input.packageId);
      await tx.registrationPackage.create({
        data: {
          id: input.packageId,
          conferenceId: conference.id,
          name: fallbackPkg?.name || "Standard Delegate Pass",
          description: fallbackPkg?.description || "Conference access pass",
          priceCents: fallbackPkg?.priceCents || 49900,
          attendanceMode: "ONSITE"
        }
      });
    }

    // Ensure country exists if countryId provided
    if (input.countryId) {
      const countryExists = await tx.country.findUnique({
        where: { id: input.countryId }
      });
      if (!countryExists) {
        const fallbackCountry = DEFAULT_COUNTRIES.find((c) => c.id === input.countryId);
        if (fallbackCountry) {
          await tx.country.create({
            data: {
              id: input.countryId,
              iso2: fallbackCountry.name.slice(0, 2).toUpperCase(),
              name: fallbackCountry.name
            }
          });
        }
      }
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
    let conference = await tx.conference.findUnique({
      where: { slug: input.conferenceSlug }
    });
    if (!conference) {
      conference = await tx.conference.findFirst({
        where: { deletedAt: null }
      });
    }
    if (!conference) {
      throw new NotFoundError("Conference not found.");
    }

    // Verify track exists before linking foreign key
    let validTrackId = input.trackId;
    if (validTrackId) {
      const trackExists = await tx.track.findUnique({
        where: { id: validTrackId }
      });
      if (!trackExists) {
        validTrackId = undefined;
      }
    }

    const submission = await tx.abstractSubmission.create({
      data: {
        conferenceId: conference.id,
        authorId,
        trackId: validTrackId,
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

