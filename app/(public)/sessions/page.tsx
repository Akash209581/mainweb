import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { Section } from "@/components/common/section";
import { SessionsLayout } from "./sessions-layout";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sessions & Tracks",
  description: "Explore the ICGIT 2026 track sessions, topics, and featured speakers."
};

export default async function SessionsPage() {
  let initialTracks = undefined;
  try {
    const settingsFile = path.join(process.cwd(), "storage", "settings.json");
    if (fs.existsSync(settingsFile)) {
      const data = JSON.parse(fs.readFileSync(settingsFile, "utf8"));
      if (Array.isArray(data.tracks) && data.tracks.length > 0) {
        initialTracks = data.tracks.filter((t: any) => t.published !== false);
      }
    }
  } catch {}

  return (
    <>
      <PageHeader
        eyebrow="Scientific Programme"
        title="Explore our scientific conference tracks"
        description="Review session guidelines, academic topics, key areas of interest, and presentation formats across our comprehensive research tracks."
      />
      <Section className="pt-0">
        <SessionsLayout initialTracks={initialTracks} />
      </Section>
    </>
  );
}
