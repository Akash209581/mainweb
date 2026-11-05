import { z } from "zod";
import {
  phoneSchema,
  personNameSchema,
  validDate,
  countryNameSchema,
  boundedInteger
} from "./public-inputs";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  sort: z.string().trim().max(60).optional(),
  direction: z.enum(["asc", "desc"]).default("asc")
});

export const contactSchema = z.object({
  name: personNameSchema.min(2).max(120),
  email: z.string().trim().email().max(180),
  category: z.enum(["delegate", "author", "sponsor", "committee"]),
  message: z.string().trim().min(12).max(4000)
});

export const registrationSchema = z
  .object({
    conferenceSlug: z.string().trim().min(1).default("icgit-2026"),
    packageId: z.string().uuid().optional(),
    fullName: z.string().trim().min(2).max(200).regex(/^[\p{L}\p{M}][\p{L}\p{M}\p{Zs}.'\u2019\-]*$/u,'Enter a valid full name.').optional(),
    email: z.string().trim().email().max(180),
    phone: phoneSchema.optional(),
    organization: z.string().trim().max(200).optional(),
    countryId: z.string().uuid().optional(),

    // Hansci Novum Registration Fields
    first: personNameSchema.max(80).optional(),
    last: personNameSchema.max(80).optional(),
    institution: z.string().trim().max(200).optional(),
    country: countryNameSchema.optional(),
    category: z
      .enum([
        "student",
        "academic",
        "industry",
        "exhibition",
        "sponsorship",
        "accommodation"
      ])
      .default("academic"),
    currency: z.enum(["EUR", "USD", "GBP"]).default("EUR"),
    role: z.string().trim().max(80).optional(),
    abstract: z.string().trim().max(80).optional(),

    // Partnership fields
    package: z.string().trim().max(100).optional(),
    representatives: boundedInteger(1, 100).optional(),
    interests: z.string().trim().max(1000).optional(),

    // Accommodation fields
    stay: z.boolean().default(false),
    checkin: z.string().trim().optional(),
    checkout: z.string().trim().optional(),
    room: z.enum(["single", "double"]).default("single"),
    rooms: boundedInteger(1, 20).default(1),
    guests: z.enum(["1", "2"]).default("1"),
    beds: z.enum(["No preference", "Double bed", "Twin beds"]).default("No preference"),
    staynotes: z.string().trim().max(500).optional(),

    // Invoice fields
    invoice: z.boolean().default(false),
    billingOrg: z.string().trim().max(200).optional(),
    address: z.string().trim().max(600).optional(),
    taxid: z.string().trim().max(80).optional(),
    po: z.string().trim().max(80).optional(),

    terms: z.boolean().refine((val) => val === true, {
      message: "You must accept the Terms & Conditions."
    })
  })
  .superRefine((data, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
    if (!data.fullName && (!data.first || !data.last))
      issue("fullName", "Enter your full name.");
    if (data.stay || data.category === "accommodation") {
      if (data.room === "single" && data.guests !== "1")
        issue("guests", "Single rooms allow one guest per room.");
      if (!data.checkin || !validDate(data.checkin))
        issue("checkin", "Enter a valid check-in date.");
      if (!data.checkout || !validDate(data.checkout))
        issue("checkout", "Enter a valid check-out date.");
      if (
        data.checkin &&
        data.checkout &&
        validDate(data.checkin) &&
        validDate(data.checkout)
      ) {
        const nights = (Date.parse(data.checkout) - Date.parse(data.checkin)) / 86400000;
        if (nights < 1 || nights > 365)
          issue("checkout", "Check-out must be after check-in, within 365 nights.");
      }
    }
    if (data.invoice) {
      if (!data.billingOrg?.trim())
        issue("billingOrg", "Enter the billing organisation.");
      if (!data.address?.trim()) issue("address", "Enter the billing address.");
    }
    if (["exhibition", "sponsorship"].includes(data.category) && !data.package?.trim())
      issue("package", "Select a partnership package.");
  });

export const publicRegistrationSchema = registrationSchema.superRefine((data, ctx) => {
  for (const key of ["first", "last", "institution", "country"] as const)
    if (!data[key]?.trim())
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: "This field is required."
      });
  if (
    ["student", "academic", "industry"].includes(data.category) &&
    !["Attendee", "Oral presenter", "Poster presenter", "Invited speaker"].includes(
      data.role || ""
    )
  )
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["role"],
      message: "Select a participation role."
    });
  if (
    data.category === "exhibition" &&
    ![
      "Tabletop display",
      "Standard exhibition stand",
      "Custom exhibition space"
    ].includes(data.package || "")
  )
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["package"],
      message: "Select a valid exhibition package."
    });
  if (
    data.category === "sponsorship" &&
    !["Platinum", "Gold", "Silver", "Custom partnership"].includes(data.package || "")
  )
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["package"],
      message: "Select a valid sponsorship package."
    });
  if (["exhibition", "sponsorship"].includes(data.category) && !data.representatives)
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["representatives"],
      message: "Enter the number of representatives."
    });
});

export const abstractSubmissionSchema = z.object({
  conferenceSlug: z.string().trim().min(1).default("icgit-2026"),
  trackId: z.string().uuid().optional(),
  title: z.string().trim().min(8).max(240),
  abstractText: z.string().trim().min(80).max(5000),
  keywords: z.array(z.string().trim().min(2).max(50)).min(1).max(8),
  fileAssetId: z.string().uuid().optional()
});

export const profileUpdateSchema = z.object({
  firstName: personNameSchema.max(80),
  lastName: personNameSchema.max(80),
  title: z.string().trim().max(80).optional(),
  designation: z.string().trim().max(120).optional(),
  phone: z.union([phoneSchema,z.literal("")]).optional(),
  bio: z.string().trim().max(1000).optional(),
  countryId: z.union([z.string().uuid(),z.literal("")]).optional(),
  organizationName: z.string().trim().max(180).optional()
});

export type ContactInput = z.infer<typeof contactSchema>;
export type RegistrationInput = z.infer<typeof registrationSchema>;
export type AbstractSubmissionInput = z.infer<typeof abstractSubmissionSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
