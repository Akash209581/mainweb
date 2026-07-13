import type { Metadata } from "next";
import Link from "next/link";
import { Handshake } from "lucide-react";
import { Button } from "@/components/buttons/button";
import { GlassCard } from "@/components/cards/glass-card";
import { PageHeader } from "@/components/common/page-header";
import { Section } from "@/components/common/section";
import { SponsorCard } from "@/components/sponsors/sponsor-card";
import { listSponsors } from "@/lib/repositories/public-content.repository";

export const metadata: Metadata = {
  title: "Sponsors",
  description: "Explore ICGIT 2026 sponsors and partnership categories."
};

export default async function SponsorsPage() {
  const { items: dbSponsors } = await listSponsors({
    page: 1,
    pageSize: 100,
    direction: "asc"
  });

  const mappedSponsors = dbSponsors.map((sponsor) => ({
    name: sponsor.name,
    tier: sponsor.sponsorTier.name,
    focus: sponsor.focus
  }));

  const tiers = ["Diamond", "Platinum", "Gold", "Silver"];
  const grouped = tiers.reduce((acc, tier) => {
    acc[tier] = mappedSponsors.filter((s) => s.tier === tier);
    return acc;
  }, {} as Record<string, typeof mappedSponsors>);

  return (
    <>
      <PageHeader
        eyebrow="Sponsors"
        title="Strategic partners for global innovation"
        description="Sponsor participation connects enterprise technology leaders with researchers, public-sector decision makers, and global conference delegates."
      />
      <Section className="pt-0 space-y-12">
        {tiers.map((tier) => {
          const list = grouped[tier];
          if (!list || list.length === 0) return null;
          return (
            <div key={tier} className="space-y-5">
              <h2 className="font-heading text-2xl font-bold text-foreground border-b border-border/20 pb-2">
                {tier} Partners
              </h2>
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                {list.map((sponsor) => (
                  <SponsorCard key={sponsor.name} sponsor={sponsor} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Sponsor CTA Block */}
        <div className="mt-12">
          <GlassCard className="flex flex-col items-center justify-between gap-6 p-8 md:flex-row bg-gradient-to-tr from-accent/5 via-primary/5 to-transparent border-accent/20">
            <div className="flex items-center gap-4">
              <div className="hidden rounded-full bg-accent/15 p-4 text-accent sm:flex">
                <Handshake className="size-8" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-foreground">
                  Partner with ICGIT 2026
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted max-w-xl">
                  Expand your corporate reach and showcase your research infrastructure to thousands of virtual and onsite delegates at the Dubai World Trade Centre.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="hover-lift">
                <Link href="/contact">Get in Touch</Link>
              </Button>
              <Button asChild variant="outline" className="hover-lift">
                <Link href="/brochure">Download Brochure</Link>
              </Button>
            </div>
          </GlassCard>
        </div>
      </Section>
    </>
  );
}

