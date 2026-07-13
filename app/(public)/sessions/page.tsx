import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { Section } from "@/components/common/section";
import { listSpeakers } from "@/lib/repositories/public-content.repository";
import { SessionsLayout } from "./sessions-layout";

export const metadata: Metadata = {
  title: "Sessions & Tracks",
  description: "Explore the ICGIT 2026 track sessions, topics, and featured speakers."
};

export default async function SessionsPage() {
  // Fetch featured speakers to display inside tracks
  const { items: speakers } = await listSpeakers({
    page: 1,
    pageSize: 100,
    direction: "asc"
  });

  const mappedSpeakers = speakers.map((s) => ({
    name: s.name,
    role: s.role,
    organization: s.organization?.name ?? "Independent",
    topic: s.topic
  }));

  return (
    <>
      <PageHeader
        eyebrow="Sessions"
        title="Explore our hybrid program tracks"
        description="Review session guidelines, academic topics, key areas of interest, and featured keynote schedules across six disciplines."
      />
      <Section className="pt-0">
        <SessionsLayout speakers={mappedSpeakers} />
      </Section>
    </>
  );
}
