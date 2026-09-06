import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { GlassCard } from "@/components/cards/glass-card";
import { PageHeader } from "@/components/common/page-header";
import { Section } from "@/components/common/section";
import { PublicInquiryForm } from "@/components/forms/public-inquiry-form";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const conf = await prisma.conference.findFirst({ where: { deletedAt: null } });
  const name = conf?.name || "ICGIT 2026";
  return {
    title: `Contact | ${name}`,
    description: `Contact the ${name} secretariat and organizing team.`
  };
}

export default async function ContactPage() {
  const [conf, contactSetting] = await Promise.all([
    prisma.conference.findFirst({
      where: { deletedAt: null },
      include: { venue: true }
    }),
    prisma.systemSetting.findFirst({
      where: { key: "page_content_contact" }
    })
  ]);

  const contactData = (contactSetting?.value as Record<string, string>) || {};
  const confName = conf?.name || "ICGIT 2026";
  const venue = conf?.venue?.name || "Dubai World Trade Centre";
  const city = conf?.venue?.city || "Dubai";
  const country = "United Arab Emirates";
  const email = contactData.email || "secretariat@icgit2026.org";
  const phone = contactData.phone || "+971 4 000 2026";

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Connect with the organizing team"
        description={`Reach the ${confName} secretariat for delegate, author, committee, sponsor, and venue inquiries.`}
      />
      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <GlassCard>
            <div className="grid gap-5 text-sm text-muted">
              <p className="flex gap-3">
                <MapPin className="size-5 shrink-0 text-accent" aria-hidden="true" />
                <span>
                  {venue}, {city}, {country}
                </span>
              </p>
              <p className="flex gap-3">
                <Mail className="size-5 shrink-0 text-accent" aria-hidden="true" />
                <span>{email}</span>
              </p>
              <p className="flex gap-3">
                <Phone className="size-5 shrink-0 text-accent" aria-hidden="true" />
                <span>{phone}</span>
              </p>
            </div>
          </GlassCard>
          <PublicInquiryForm />
        </div>
      </Section>
    </>
  );
}
