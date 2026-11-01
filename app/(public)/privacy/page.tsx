import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { Section } from "@/components/common/section";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Notice — ICGIT 2026",
  description: "Privacy information and delegate data protection commitments for ICGIT 2026."
};

export default function PrivacyPage() {
  let privacyText = "Your personal details will be processed exclusively for conference management, registration, and certification in compliance with international privacy protocols.";
  try {
    const settingsFile = path.join(process.cwd(), "storage", "settings.json");
    if (fs.existsSync(settingsFile)) {
      const data = JSON.parse(fs.readFileSync(settingsFile, "utf8"));
      if (data.policies?.privacy) {
        privacyText = data.policies.privacy;
      }
    }
  } catch {}

  return (
    <>
      <PageHeader
        eyebrow="Privacy Policy"
        title="Privacy commitments & data protection"
        description="Official delegate and author privacy policy, retention standards, and governance."
      />
      <Section className="pt-0">
        <div className="max-w-3xl rounded-2xl border border-border/50 bg-surface/50 p-6 sm:p-8 space-y-4">
          <p className="text-sm leading-7 text-muted whitespace-pre-line">
            {privacyText}
          </p>
        </div>
      </Section>
    </>
  );
}
