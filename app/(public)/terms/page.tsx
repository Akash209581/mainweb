import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { Section } from "@/components/common/section";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms information for the ICGIT 2026 conference portal."
};

export default function TermsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Terms"
        title="Conference terms"
        description="Registration, payment, cancellation, author, and sponsor terms will be finalized after Part 2 defines operational policies and secure workflows."
      />
      <Section className="pt-0">
        <p className="max-w-3xl text-sm leading-7 text-muted">
          Current pages provide public conference information only and do not create a
          binding registration, submission, or sponsor agreement.
        </p>
      </Section>
    </>
  );
}
