import type { Metadata } from "next";
import { Users, CreditCard } from "lucide-react";
import { GlassCard } from "@/components/cards/glass-card";
import { PageHeader } from "@/components/common/page-header";
import { Section } from "@/components/common/section";
import { RegistrationForm } from "@/components/forms/registration-form";
import { prisma } from "@/lib/prisma/client";
import { memoize } from "@/lib/cache";

import { DEFAULT_PACKAGES, DEFAULT_COUNTRIES } from "@/constants/conference";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Registration",
  description: "Register as an ICGIT 2026 onsite or virtual delegate."
};

export default async function RegistrationPage() {
  const { packages, countries } = await memoize("registration_page_data", 15000, async () => {
    try {
      const [dbPackages, dbCountries] = await Promise.all([
        prisma.registrationPackage.findMany({
          where: { deletedAt: null },
          orderBy: { priceCents: "asc" }
        }),
        prisma.country.findMany({
          orderBy: { name: "asc" }
        })
      ]);

      return {
        packages:
          dbPackages.length > 0
            ? dbPackages.map((p) => ({
                id: p.id,
                name: p.name,
                description: p.description,
                priceCents: p.priceCents
              }))
            : DEFAULT_PACKAGES,
        countries:
          dbCountries.length > 0
            ? dbCountries.map((c) => ({
                id: c.id,
                name: c.name
              }))
            : DEFAULT_COUNTRIES
      };
    } catch (err) {
      console.error("RegistrationPage DB error, falling back to defaults:", err);
      return {
        packages: DEFAULT_PACKAGES,
        countries: DEFAULT_COUNTRIES
      };
    }
  });

  return (
    <>
      <PageHeader
        eyebrow="Register"
        title="Secure your pass for ICGIT 2026"
        description="Choose onsite participation in Dubai or virtual hybrid streaming. Review delegate benefits and package choices below."
      />
      <Section className="pt-0">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Main Pricing & Info */}
          <div className="space-y-6">
            <RegistrationForm
              packages={packages.map((p) => ({
                id: p.id,
                name: p.name,
                description: p.description,
                priceCents: p.priceCents
              }))}
              countries={countries.map((c) => ({
                id: c.id,
                name: c.name
              }))}
            />
          </div>

          {/* Guidelines Sidebar */}
          <div className="space-y-6">
            <GlassCard>
              <Users className="size-10 text-accent" aria-hidden="true" />
              <h3 className="mt-5 font-heading text-xl font-bold text-foreground">
                Delegate Inclusions
              </h3>
              <p className="mt-3 text-xs leading-5 text-muted">
                Each package grants full access to academic paper presentations, keynote roundtables, brochure downloads, and the virtual network lobby.
              </p>
            </GlassCard>

            <GlassCard>
              <CreditCard className="size-10 text-accent" aria-hidden="true" />
              <h3 className="mt-5 font-heading text-xl font-bold text-foreground">
                Payment Verification
              </h3>
              <p className="mt-3 text-xs leading-5 text-muted">
                After submission, your status remains PENDING. A secure invoice payment gateway link will be emailed to finalize your pass.
              </p>
            </GlassCard>
          </div>
        </div>
      </Section>
    </>
  );
}
