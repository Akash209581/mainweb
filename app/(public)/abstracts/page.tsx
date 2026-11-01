import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { Section } from "@/components/common/section";
import { AbstractSubmissionForm } from "@/components/forms/abstract-submission-form";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Submit Abstract — ICGIT 2026",
  description: "Submit research abstracts for ICGIT 2026 peer review and conference presentation."
};

interface AbstractsPageProps {
  searchParams: Promise<{
    track?: string;
  }>;
}

export default async function AbstractsPage({ searchParams }: AbstractsPageProps) {
  const params = await searchParams;
  const defaultTrack = params.track || "";

  let abstractSettings = undefined;
  let availableTracks: string[] | undefined = undefined;

  try {
    const settingsFile = path.join(process.cwd(), "storage", "settings.json");
    if (fs.existsSync(settingsFile)) {
      const data = JSON.parse(fs.readFileSync(settingsFile, "utf8"));
      if (data.abstractSettings) {
        abstractSettings = data.abstractSettings;
      }
      if (Array.isArray(data.tracks) && data.tracks.length > 0) {
        availableTracks = data.tracks
          .filter((t: any) => t.published !== false)
          .map((t: any) => t.name);
      }
    }
  } catch {}

  return (
    <>
      <PageHeader
        eyebrow="Call for Contributions"
        title="Your research deserves a wider conversation"
        description="Share your findings with the international scientific community. Submit an abstract for consideration as an oral presentation or interactive poster session."
      />
      <Section className="pt-0">
        <AbstractSubmissionForm
          defaultTrack={defaultTrack}
          abstractSettings={abstractSettings}
          availableTracks={availableTracks}
        />
      </Section>
    </>
  );
}
