import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  sort: z.string().trim().max(60).optional(),
  direction: z.enum(["asc", "desc"]).default("asc")
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  category: z.enum(["delegate", "author", "sponsor", "committee"]),
  message: z.string().trim().min(12).max(4000)
});

export const registrationSchema = z.object({
  conferenceSlug: z.string().trim().min(1).default("icgit-2026"),
  packageId: z.string().uuid().optional(),
  fullName: z.string().trim().min(2).max(160).optional(),
  email: z.string().trim().email().max(180),
  organization: z.string().trim().max(180).optional(),
  countryId: z.string().uuid().optional(),

  // Hansci Novum Registration Fields
  first: z.string().trim().min(1).max(80).optional(),
  last: z.string().trim().min(1).max(80).optional(),
  institution: z.string().trim().max(200).optional(),
  country: z.string().trim().max(100).optional(),
  category: z.enum([
    "student",
    "academic",
    "industry",
    "exhibition",
    "sponsorship",
    "accommodation"
  ]).default("academic"),
  currency: z.enum(["EUR", "USD", "GBP"]).default("EUR"),
  role: z.string().trim().max(80).optional(),
  abstract: z.string().trim().max(80).optional(),

  // Partnership fields
  package: z.string().trim().max(100).optional(),
  representatives: z.coerce.number().int().min(1).max(100).optional(),
  interests: z.string().trim().max(1000).optional(),

  // Accommodation fields
  stay: z.boolean().default(false),
  checkin: z.string().trim().optional(),
  checkout: z.string().trim().optional(),
  room: z.enum(["single", "double"]).default("single"),
  rooms: z.coerce.number().int().min(1).max(20).default(1),
  guests: z.string().trim().default("1"),
  beds: z.string().trim().default("No preference"),
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
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  title: z.string().trim().max(80).optional(),
  designation: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  bio: z.string().trim().max(1000).optional(),
  countryId: z.string().uuid().optional(),
  organizationName: z.string().trim().max(180).optional()
});

export type ContactInput = z.infer<typeof contactSchema>;
export type RegistrationInput = z.infer<typeof registrationSchema>;
export type AbstractSubmissionInput = z.infer<typeof abstractSubmissionSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
