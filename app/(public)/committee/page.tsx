import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { Section } from "@/components/common/section";
import { CommitteeClient } from "@/components/committee/committee-client";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Organizing Committee — ICGIT 2026",
  description: "Meet the international organizing committee, scientific chairs, and academic leadership of ICGIT 2026."
};

export default function CommitteePage() {
  let initialMembers = undefined;
  try {
    const settingsFile = path.join(process.cwd(), "storage", "settings.json");
    if (fs.existsSync(settingsFile)) {
      const data = JSON.parse(fs.readFileSync(settingsFile, "utf8"));
      if (Array.isArray(data.committee) && data.committee.length > 0) {
        initialMembers = data.committee.filter((m: any) => m.published !== false);
      }
    }
  } catch {}

  return (
    <>
      <PageHeader
        eyebrow="Organizing Committee"
        title="Shared expertise. A common purpose."
        description="Meet the academic, technical, and local leadership who help shape the scientific programme, peer review standards, and conference delegate experience."
      />
      <Section className="pt-0">
        <CommitteeClient initialMembers={initialMembers} />
      </Section>
    </>
  );
}
