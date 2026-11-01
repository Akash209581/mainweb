import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { Section } from "@/components/common/section";
import { RegistrationForm } from "@/components/forms/registration-form";
import { prisma } from "@/lib/prisma/client";
import { memoize } from "@/lib/cache";
import { DEFAULT_COUNTRIES } from "@/constants/conference";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Registration — ICGIT 2026",
  description: "Register for ICGIT 2026. Choose your delegate category and optional conference venue accommodation."
};

export default async function RegistrationPage() {
  let customPricing = undefined;
  try {
    const settingsFile = path.join(process.cwd(), "storage", "settings.json");
    if (fs.existsSync(settingsFile)) {
      const data = JSON.parse(fs.readFileSync(settingsFile, "utf8"));
      if (data.pricing) {
        customPricing = data.pricing;
      }
    }
  } catch {}

  const { countries } = await memoize("registration_page_countries", 15000, async () => {
    try {
      const dbCountries = await prisma.country.findMany({
        orderBy: { name: "asc" }
      });

      return {
        countries:
          dbCountries.length > 0
            ? dbCountries.map((c) => ({
                id: c.id,
                name: c.name
              }))
            : DEFAULT_COUNTRIES
      };
    } catch (err) {
      console.warn("RegistrationPage DB error, falling back to default countries:", err);
      return {
        countries: DEFAULT_COUNTRIES
      };
    }
  });

  return (
    <>
      <PageHeader
        eyebrow="Registration & Accommodation"
        title="Secure your pass for ICGIT 2026"
        description="Join leading researchers, academics and industry pioneers. Choose your delegate pass, add optional venue accommodation, and obtain verified participation."
      />
      <Section className="pt-0">
        <RegistrationForm initialCountries={countries} customPricing={customPricing} />
      </Section>
    </>
  );
}
