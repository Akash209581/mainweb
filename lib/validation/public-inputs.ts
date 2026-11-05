import { z } from "zod";
export const personNameSchema = z
  .string()
  .trim()
  .min(1, "Enter your name.")
  .max(160)
  .regex(
    /^[\p{L}\p{M}][\p{L}\p{M}\p{Zs}.'\u2019\-]*$/u,
    "Names may contain letters, spaces, apostrophes and hyphens."
  );
export const phoneSchema = z
  .string()
  .trim()
  .max(40)
  .regex(/^\+?[0-9][0-9 ()-]*$/, "Phone numbers cannot contain letters.")
  .refine((v) => {
    const n = v.replace(/\D/g, "").length;
    return n >= 7 && n <= 15;
  }, "Enter a phone number containing 7-15 digits, including the country code.");
const countryNames = new Set<string>();
const display = new Intl.DisplayNames(["en"], { type: "region" });
for (let a = 65; a <= 90; a++)
  for (let b = 65; b <= 90; b++) {
    const code = String.fromCharCode(a, b),
      name = display.of(code);
    if (
      name &&
      name !== code &&
      !["EU", "UN", "EZ", "QO", "XA", "XB", "ZZ"].includes(code)
    )
      countryNames.add(name);
  }
for (const name of [
  "United States of America",
  "South Korea",
  "North Korea",
  "Russia",
  "Vietnam",
  "Turkey",
  "Czech Republic",
  "Ivory Coast",
  "Vatican City"
])
  countryNames.add(name);
export const countryNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .refine((v) => countryNames.has(v), "Choose a valid country / region.");
export function boundedInteger(min: number, max: number) {
  return z.preprocess(
    (v) => (typeof v === "string" ? (/^\d+$/.test(v.trim()) ? Number(v) : NaN) : v),
    z.number().int("Enter a whole number.").min(min).max(max)
  );
}
const text = (max: number, min = 1) =>
  z
    .string()
    .trim()
    .min(min, "This field is required.")
    .max(max)
    .refine(
      (v) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v),
      "Remove unsupported control characters."
    );
const consent = z.union([z.literal(true), z.literal("on")]).transform(() => true);
export const brochureRequestSchema = z.object({
  first: personNameSchema.max(80),
  last: personNameSchema.max(80),
  email: z.string().trim().email().max(180),
  phone: phoneSchema,
  institution: text(200),
  country: countryNameSchema,
  interest: z.enum([
    "Attending the conference",
    "Oral presentation",
    "Poster presentation",
    "Exhibition",
    "Sponsorship",
    "Academic collaboration",
    "General information"
  ]),
  privacy: consent,
  updates: z.boolean().default(false)
});
export const conferenceQuerySchema = z.object({
  name: personNameSchema,
  email: z.string().trim().email().max(180),
  subject: z.enum([
    "Brochure",
    "Registration",
    "Abstract submission",
    "Exhibition / sponsorship",
    "Accommodation",
    "Other"
  ]),
  message: text(2000, 12),
  privacy: consent
});
export const publicAbstractSchema = z.object({
  conferenceSlug: z.string().trim().min(1).max(100).default("icgit-2026"),
  first: personNameSchema.max(80),
  last: personNameSchema.max(80),
  email: z.string().trim().email().max(180),
  institution: text(200),
  phone: phoneSchema,
  country: countryNameSchema,
  title: text(250, 8),
  track: text(200),
  presentation: z.enum(["Oral presentation", "Poster presentation"]),
  coAuthors: z
    .array(z.object({ name: personNameSchema, affiliation: text(200) }))
    .max(20)
    .default([]),
  authorsConsent: consent,
  ethics: consent,
  terms: consent
});
export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00.000Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
