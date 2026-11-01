import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { Section } from "@/components/common/section";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms of Service — ICGIT 2026",
  description: "Conference terms and delegate conditions for ICGIT 2026."
};

export default function TermsPage() {
  let termsText = "All accepted abstracts and registered delegates are subject to conference code of conduct, peer review guidelines, and attendance conditions.";
  try {
    const settingsFile = path.join(process.cwd(), "storage", "settings.json");
    if (fs.existsSync(settingsFile)) {
      const data = JSON.parse(fs.readFileSync(settingsFile, "utf8"));
      if (data.policies?.terms) {
        termsText = data.policies.terms;
      }
    }
  } catch {}

  return (
    <>
      <PageHeader
        eyebrow="Terms & Conditions"
        title="Conference terms & delegate conditions"
        description="Official delegate attendance terms, registration policies, and code of conduct."
      />
      <Section className="pt-0">
        <div className="max-w-3xl rounded-2xl border border-border/50 bg-surface/50 p-6 sm:p-8 space-y-4">
          <p className="text-sm leading-7 text-muted whitespace-pre-line">
            {termsText}
          </p>
        </div>
      </Section>
    </>
  );
}
