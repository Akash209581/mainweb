import type {
  AbstractSubmissionInput,
  ContactInput,
  RegistrationInput
} from "@/lib/validation/schemas";
import type { FileVisibility, Registration } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
import { NotFoundError,ValidationError } from "@/lib/errors/app-error";

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
import fs from "fs";
import path from "path";

const CATEGORY_PRICES: Record<string, Record<string, number>> = {
  student: { EUR: 199, USD: 219, GBP: 179 },
  academic: { EUR: 399, USD: 439, GBP: 359 },
  industry: { EUR: 499, USD: 549, GBP: 449 },
  accommodation: { EUR: 0, USD: 0, GBP: 0 }
};

const ROOM_RATES: Record<string, Record<string, number>> = {
  single: { EUR: 120, USD: 135, GBP: 105 },
  double: { EUR: 160, USD: 180, GBP: 140 }
};

export async function createRegistration(input: RegistrationInput, userId?: string) {
  const firstName = input.first || input.fullName?.split(" ")[0] || "";
  const lastName = input.last || input.fullName?.split(" ").slice(1).join(" ") || "";
  const fullName = ((firstName && lastName ? `${firstName} ${lastName}` : input.fullName) || "").trim() || "Participant";
  const organization = input.organization || input.institution || null;
  const countryName = input.country || null;

  let categoryPrices = CATEGORY_PRICES;
  let roomRates = ROOM_RATES;
  try {
    const saved = await prisma.systemSetting.findFirst({
      where: {
        key: "registration_pricing",
        conference: {
          slug: { equals: input.conferenceSlug || "icgit-2026", mode: "insensitive" },
          deletedAt: null
        }
      }
    });
    const pricing = saved?.value as Record<string, any> | undefined;
    const validRate = (value: unknown): value is number =>
      typeof value === "number" &&
      Number.isFinite(value) &&
      value >= 0 &&
      value <= 1000000;
    if (pricing) {
      categoryPrices = structuredClone(CATEGORY_PRICES);
      roomRates = structuredClone(ROOM_RATES);
      for (const category of ["student", "academic", "industry"])
        for (const code of ["EUR", "USD", "GBP"])
          if (validRate(pricing[category]?.[code]))
            categoryPrices[category][code] = pricing[category][code];
      for (const room of ["single", "double"])
        for (const code of ["EUR", "USD", "GBP"])
          if (validRate(pricing.accommodation?.[room]?.[code]))
            roomRates[room][code] = pricing.accommodation[room][code];
    }
  } catch {
    /* Retain existing fallback rates if saved configuration is unavailable. */
  }
  const isQuoteRequired =
    input.category === "exhibition" || input.category === "sponsorship";
  const currency = input.currency || "EUR";
  const regFeeUnit =
    !isQuoteRequired && categoryPrices[input.category]
      ? categoryPrices[input.category][currency] || 0
      : 0;
  const registrationFeeCents = Math.round(regFeeUnit * 100);

  let accommodationFeeCents = 0;
  let checkInDate: Date | null = null;
  let checkOutDate: Date | null = null;
  const hasStay = input.category === "accommodation" || Boolean(input.stay);

  if (hasStay && input.checkin && input.checkout) {
    checkInDate = new Date(input.checkin);
    checkOutDate = new Date(input.checkout);
    const diffTime = Math.max(0, checkOutDate.getTime() - checkInDate.getTime());
    const nights = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const roomRate = (roomRates[input.room] && roomRates[input.room][currency]) ?? 120;
    accommodationFeeCents = Math.round(nights * (input.rooms || 1) * roomRate * 100);
  }

  const totalAmountCents = isQuoteRequired
    ? 0
    : registrationFeeCents + accommodationFeeCents;
  if(!Number.isSafeInteger(totalAmountCents)||totalAmountCents>2147483647)throw new ValidationError("The requested total is too large. Contact the secretariat for a quote.");
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  const referenceNumber = `HNS-${new Date().getFullYear()}-${randomDigits}`;

  try {
    return await prisma.$transaction(async (tx) => {
      let conference = await tx.conference.findUnique({
        where: { slug: input.conferenceSlug }
      });
      if (!conference || conference.deletedAt) throw new NotFoundError("Conference not found.");

      const packageId = input.packageId;
      if (packageId) {
        const pkgExists = await tx.registrationPackage.findUnique({
          where: { id: packageId }
        });
        if (!pkgExists || pkgExists.conferenceId !== conference.id || pkgExists.deletedAt) throw new NotFoundError("Registration package not found for this conference.");
      }

      if (input.countryId) {
        const countryExists = await tx.country.findUnique({
          where: { id: input.countryId }
        });
        if (!countryExists) throw new NotFoundError("Country not found.");
      }

      const registration = await tx.registration.create({
        data: {
          conferenceId: conference.id,
          userId,
          registrationPackageId: packageId || null,
          referenceNumber,
          fullName,
          firstName,
          lastName,
          email: input.email,
          phone: input.phone || null,
          organization,
          countryId: input.countryId || null,
          countryName,
          category: input.category,
          participationRole: input.role || null,
          abstractReference: input.abstract || null,
          currency,
          registrationFeeCents,
          totalAmountCents,
          isQuoteRequired,
          partnerPackage: input.package || null,
          representativesCount: input.representatives
            ? Number(input.representatives)
            : null,
          partnerInterests: input.interests || null,
          hasStay,
          checkInDate,
          checkOutDate,
          roomType: hasStay ? input.room : null,
          roomCount: hasStay ? Number(input.rooms) : 1,
          guestsPerRoom: hasStay ? String(input.guests) : null,
          bedPreference: hasStay ? input.beds : null,
          accommodationNotes: hasStay ? input.staynotes : null,
          accommodationFeeCents,
          needsInvoice: Boolean(input.invoice),
          billingOrg: input.billingOrg || null,
          billingAddress: input.address || null,
          taxId: input.taxid || null,
          poNumber: input.po || null,
          status: isQuoteRequired ? "PENDING" : "CONFIRMED"
        }
      });

      if (input.invoice && totalAmountCents > 0) {
        await tx.invoice.create({
          data: {
            registrationId: registration.id,
            invoiceNumber: `INV-${referenceNumber}`,
            amountCents: totalAmountCents,
            currency
          }
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: "registration.created",
          entity: "Registration",
          entityId: registration.id,
          metadata: { referenceNumber, category: input.category, totalAmountCents, termsAccepted: input.terms }
        }
      });

      return registration;
    });
  } catch (dbError) {
    throw dbError;
  }
}

export async function createAbstractSubmission(
  input: AbstractSubmissionInput,
  authorId: string
) {
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
