import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { Section } from "@/components/common/section";
import { SpeakerCard } from "@/components/speakers/speaker-card";
import { SearchBar } from "@/components/common/search-bar";
import { Pagination } from "@/components/common/pagination";
import { EmptyState } from "@/components/common/empty-state";
import { listSpeakers } from "@/lib/repositories/public-content.repository";

export const metadata: Metadata = {
  title: "Speakers",
  description: "Browse featured ICGIT 2026 speakers and keynote topics."
};

interface SpeakersPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    direction?: string;
  }>;
}

export default async function SpeakersPage({ searchParams }: SpeakersPageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const search = params.search ?? "";
  const direction = (params.direction === "desc" ? "desc" : "asc") as "asc" | "desc";

  const { items, total, pageSize } = await listSpeakers({
    page,
    pageSize: 8,
    search,
    direction
  });

  const mappedSpeakers = items.map((speaker) => ({
    name: speaker.name,
    role: speaker.role,
    organization: speaker.organization?.name ?? "Independent",
    topic: speaker.topic
  }));

  return (
    <>
      <PageHeader
        eyebrow="Speakers"
        title="Featured global innovation speakers"
        description="A curated speaker program focused on responsible AI, smart systems, health innovation, and public-private technology strategy."
      />
      <Section className="pt-0">
        <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchBar placeholder="Search speakers, topics or roles..." />
        </div>
        
        {mappedSpeakers.length === 0 ? (
          <EmptyState title="No speakers found" message="Try searching for a different name, role, or keynote topic." />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {mappedSpeakers.map((speaker) => (
              <SpeakerCard key={speaker.name} speaker={speaker} />
            ))}
          </div>
        )}

        <Pagination total={total} page={page} pageSize={pageSize} />
      </Section>
    </>
  );
}

