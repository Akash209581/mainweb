import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { GlassCard } from "@/components/cards/glass-card";
import { PageHeader } from "@/components/common/page-header";
import { Section } from "@/components/common/section";
import { PublicInquiryForm } from "@/components/forms/public-inquiry-form";
import { CONFERENCE } from "@/constants/conference";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the ICGIT 2026 organizing team."
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Connect with the organizing team"
        description="Reach the ICGIT 2026 secretariat for delegate, author, committee, sponsor, and venue inquiries."
      />
      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <GlassCard>
            <div className="grid gap-5 text-sm text-muted">
              <p className="flex gap-3">
                <MapPin className="size-5 shrink-0 text-accent" aria-hidden="true" />
                <span>
                  {CONFERENCE.venue}, {CONFERENCE.city}, {CONFERENCE.country}
                </span>
              </p>
              <p className="flex gap-3">
                <Mail className="size-5 shrink-0 text-accent" aria-hidden="true" />
                <span>{CONFERENCE.email}</span>
              </p>
              <p className="flex gap-3">
                <Phone className="size-5 shrink-0 text-accent" aria-hidden="true" />
                <span>{CONFERENCE.phone}</span>
              </p>
            </div>
          </GlassCard>
          <PublicInquiryForm />
        </div>
      </Section>
    </>
  );
}
