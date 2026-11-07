import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import { PageHeader } from "@/components/common/page-header";
import { Section } from "@/components/common/section";
import { SpeakerCard } from "@/components/speakers/speaker-card";
import { SearchBar } from "@/components/common/search-bar";
import { Pagination } from "@/components/common/pagination";
import { EmptyState } from "@/components/common/empty-state";
import { listSpeakers } from "@/lib/repositories/public-content.repository";
import { SPEAKERS } from "@/constants/conference";

export const dynamic = "force-dynamic";

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
  const search = (params.search ?? "").toLowerCase().trim();
  const direction = (params.direction === "desc" ? "desc" : "asc") as "asc" | "desc";

  let settingsSpeakers: any[] = [];
  try {
    const sf = path.join(process.cwd(), "storage", "settings.json");
    if (fs.existsSync(sf)) {
      const data = JSON.parse(fs.readFileSync(sf, "utf8"));
      if (Array.isArray(data.speakers) && data.speakers.length > 0) {
        settingsSpeakers = data.speakers.filter((s: any) => s.published !== false);
      }
    }
  } catch {}

  let mappedSpeakers: Array<{
    name: string;
    role: string;
    organization: string;
    topic: string;
    imageAssetId?: string | null;
  }> = [];

  let totalCount = 0;
  const pageSize = 8;

  if (settingsSpeakers.length > 0) {
    const filtered = search
      ? settingsSpeakers.filter(
          (s) =>
            s.name?.toLowerCase().includes(search) ||
            s.role?.toLowerCase().includes(search) ||
            s.organizationName?.toLowerCase().includes(search) ||
            s.topic?.toLowerCase().includes(search)
        )
      : settingsSpeakers;

    totalCount = filtered.length;
    const startIndex = (page - 1) * pageSize;
    const paginated = filtered.slice(startIndex, startIndex + pageSize);

    mappedSpeakers = paginated.map((s) => ({
      name: s.name,
      role: s.role,
      organization: s.organizationName || "Independent",
      topic: s.topic,
      imageAssetId: s.photo?.url || null
    }));
  } else {
    const { items, total } = await listSpeakers({
      page,
      pageSize,
      search,
      direction
    });

    totalCount = total;
    mappedSpeakers =
      items.length > 0
        ? items.map((speaker) => ({
            name: speaker.name,
            role: speaker.role,
            organization: speaker.organization?.name ?? "Independent",
            topic: speaker.topic,
            imageAssetId: speaker.imageAsset?.storageKey || speaker.imageAssetId || null
          }))
        : !search
        ? SPEAKERS.map((s) => ({ ...s, imageAssetId: null }))
        : [];
  }

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

        <Pagination total={totalCount} page={page} pageSize={pageSize} />
      </Section>
    </>
  );
}
