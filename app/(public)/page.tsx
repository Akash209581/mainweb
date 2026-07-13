import type { Metadata } from "next";
import { prisma } from "@/lib/prisma/client";
import { HomeClient } from "@/components/home/home-client";
import { memoize } from "@/lib/cache";

export const metadata: Metadata = {
  title: "ICGIT 2026 - Global Innovation & Technology Summit",
  description: "8th International Conference on Global Innovation & Technology, December 8-10, 2026, Dubai, UAE."
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { mappedSpeakers, mappedTracks, customContent } = await memoize("home_page_data", 15000, async () => {
    const [speakers, tracks, homeSetting] = await Promise.all([
      prisma.speaker.findMany({
        where: { deletedAt: null },
        include: { organization: true },
        orderBy: { sortOrder: "asc" }
      }),
      prisma.track.findMany({
        where: { deletedAt: null },
        orderBy: { name: "asc" }
      }),
      prisma.systemSetting.findFirst({
        where: { key: "page_content_home" }
      })
    ]);

    const mappedSpeakers = speakers.map((s) => ({
      id: s.id,
      name: s.name,
      role: s.role,
      topic: s.topic,
      bio: s.bio,
      imageAssetId: s.imageAssetId,
      organizationName: s.organization?.name ?? "N/A"
    }));

    const mappedTracks = tracks.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description
    }));

    const customContent = homeSetting?.value as unknown as Array<{ id: string; name: string; visible?: boolean; fields: Record<string, string>; }>;

    return { mappedSpeakers, mappedTracks, customContent };
  });

  return (
    <HomeClient
      speakers={mappedSpeakers}
      tracks={mappedTracks}
      customContent={customContent}
    />
  );
}
