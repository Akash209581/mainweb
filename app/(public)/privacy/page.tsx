import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { Section } from "@/components/common/section";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy information for the ICGIT 2026 conference portal."
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Privacy"
        title="Privacy commitments"
        description="Privacy, retention, consent, and security controls will be finalized with the authentication, database, and API requirements in Part 2."
      />
      <Section className="pt-0">
        <p className="max-w-3xl text-sm leading-7 text-muted">
          This foundation intentionally avoids persisting personal data until the secure
          backend specification is provided.
        </p>
      </Section>
    </>
  );
}
