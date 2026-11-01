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
  const fullName = (input.fullName || `${firstName} ${lastName}`).trim() || "Participant";
  const organization = input.organization || input.institution || null;
  const countryName = input.country || null;

  const isQuoteRequired = input.category === "exhibition" || input.category === "sponsorship";
  const currency = input.currency || "EUR";
  const regFeeUnit = !isQuoteRequired && CATEGORY_PRICES[input.category] ? CATEGORY_PRICES[input.category][currency] || 0 : 0;
  const registrationFeeCents = regFeeUnit * 100;

  let accommodationFeeCents = 0;
  let checkInDate: Date | null = null;
  let checkOutDate: Date | null = null;
  const hasStay = input.category === "accommodation" || Boolean(input.stay);

  if (hasStay && input.checkin && input.checkout) {
    checkInDate = new Date(input.checkin);
    checkOutDate = new Date(input.checkout);
    const diffTime = Math.max(0, checkOutDate.getTime() - checkInDate.getTime());
    const nights = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const roomRate = (ROOM_RATES[input.room] && ROOM_RATES[input.room][currency]) || 120;
    accommodationFeeCents = nights * (input.rooms || 1) * roomRate * 100;
  }

  const totalAmountCents = isQuoteRequired ? 0 : registrationFeeCents + accommodationFeeCents;
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  const referenceNumber = `HNS-${new Date().getFullYear()}-${randomDigits}`;

  try {
    return await prisma.$transaction(async (tx) => {
      let conference = await tx.conference.findUnique({
        where: { slug: input.conferenceSlug }
      });
      if (!conference) {
        conference = await tx.conference.findFirst({
          where: { deletedAt: null }
        });
      }
      if (!conference) {
        conference = await tx.conference.create({
          data: {
            slug: input.conferenceSlug || "icgit-2026",
            name: "ICGIT 2026",
            fullName: "International Conference on Global Innovative Technology 2026",
            description: "Leading scientific exchange and global innovation conference.",
            startDate: new Date("2026-10-15T09:00:00Z"),
            endDate: new Date("2026-10-18T18:00:00Z"),
            mode: "HYBRID"
          }
        });
      }

      let packageId = input.packageId;
      if (packageId) {
        const pkgExists = await tx.registrationPackage.findUnique({
          where: { id: packageId }
        });
        if (!pkgExists) {
          const fallbackPkg = DEFAULT_PACKAGES.find((p) => p.id === packageId);
          await tx.registrationPackage.create({
            data: {
              id: packageId,
              conferenceId: conference.id,
              name: fallbackPkg?.name || `${input.category.toUpperCase()} Pass`,
              description: fallbackPkg?.description || "Conference access pass",
              priceCents: fallbackPkg?.priceCents || registrationFeeCents || 39900,
              attendanceMode: "ONSITE"
            }
          });
        }
      }

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
          registrationPackageId: packageId || null,
          referenceNumber,
          fullName,
          firstName,
          lastName,
          email: input.email,
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
          representativesCount: input.representatives ? Number(input.representatives) : null,
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
          metadata: { referenceNumber, category: input.category, totalAmountCents }
        }
      });

      return registration;
    });
  } catch (dbError) {
    console.warn("Database storage failed or not connected, persisting to local storage backup:", dbError);
    const syncDirs = [
      path.join(process.cwd(), "storage"),
      "C:\\Users\\banda\\Desktop\\conference-admin\\storage"
    ];

    const curSymbol: Record<string, string> = { EUR: "€", USD: "$", GBP: "£" };
    const sym = curSymbol[currency] || currency;
    const regFeeNumeric = Math.round(registrationFeeCents / 100);

    const fallbackRegistration = {
      id: `local-${randomDigits}`,
      referenceNumber,
      name: fullName,
      fullName,
      firstName,
      lastName,
      email: input.email,
      number: (input as any).phone || "N/A",
      phone: (input as any).phone || "N/A",
      organization,
      institution: organization || "Independent",
      country: countryName || "N/A",
      countryName,
      category: input.category,
      title: input.role || (input.category ? `${input.category.charAt(0).toUpperCase() + input.category.slice(1)} Delegate` : "Academic Delegate"),
      participationRole: input.role || null,
      abstractReference: input.abstract || null,
      currency,
      regAmount: regFeeNumeric,
      registrationFeeCents,
      totalAmountCents,
      currencyAndRegAmount: `${currency} ${sym}${regFeeNumeric}`,
      address: input.address || input.billingOrg || "N/A",
      billingAddress: input.address || null,
      isQuoteRequired,
      partnerPackage: input.package || null,
      representativesCount: input.representatives ? Number(input.representatives) : null,
      partnerInterests: input.interests || null,
      hasStay,
      checkInDate: checkInDate?.toISOString() || null,
      checkOutDate: checkOutDate?.toISOString() || null,
      roomType: hasStay ? input.room : null,
      roomCount: hasStay ? Number(input.rooms) : 1,
      guestsPerRoom: hasStay ? String(input.guests) : null,
      bedPreference: hasStay ? input.beds : null,
      accommodationNotes: hasStay ? input.staynotes : null,
      accommodationFeeCents,
      needsInvoice: Boolean(input.invoice),
      billingOrg: input.billingOrg || null,
      taxId: input.taxid || null,
      poNumber: input.po || null,
      status: isQuoteRequired ? "PENDING" : "CONFIRMED",
      createdAt: new Date().toISOString()
    };

    for (const d of syncDirs) {
      try {
        if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
        const targetFile = path.join(d, "registrations_backup.json");
        let existingList: any[] = [];
        if (fs.existsSync(targetFile)) {
          try {
            existingList = JSON.parse(fs.readFileSync(targetFile, "utf8"));
          } catch {
            existingList = [];
          }
        }
        existingList.push(fallbackRegistration);
        fs.writeFileSync(targetFile, JSON.stringify(existingList, null, 2), "utf8");
      } catch (syncErr) {
        console.warn("Registration backup sync error for dir", d, syncErr);
      }
    }

    return fallbackRegistration as any;
  }
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

