import type { Metadata } from "next";
import { prisma } from "@/lib/prisma/client";
import { HomeClient, type ConferenceInfo } from "@/components/home/home-client";
import { memoize } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const [conf, seoSetting] = await Promise.all([
      prisma.conference.findFirst({
        where: { deletedAt: null },
        include: { venue: true }
      }),
      prisma.systemSetting.findFirst({
        where: { key: "seo_metadata" }
      })
    ]);

    const seoVal = (seoSetting?.value as Record<string, string>) || {};
    const confName = conf?.name || "ICGIT 2026";
    const metaTitle = seoVal.metaTitle || `${confName} - Global Innovation & Technology Summit`;
    const metaDescription =
      seoVal.metaDescription ||
      conf?.description ||
      "8th International Conference on Global Innovation & Technology, Dubai, UAE.";

    return {
      title: metaTitle,
      description: metaDescription
    };
  } catch {
    return {
      title: "ICGIT 2026 - Global Innovation & Technology Summit",
      description: "8th International Conference on Global Innovation & Technology, Dubai, UAE."
    };
  }
}

export default async function HomePage() {
  const { mappedSpeakers, mappedTracks, customContent, conferenceInfo, themeTokens } = await memoize(
    "home_page_data_live",
    10000,
    async () => {
      try {
        const [speakers, tracks, homeSetting, conf, activeTheme] = await Promise.all([
          prisma.speaker.findMany({
            where: { deletedAt: null },
            include: { organization: true, imageAsset: true },
            orderBy: { sortOrder: "asc" }
          }),
          prisma.track.findMany({
            where: { deletedAt: null },
            orderBy: { name: "asc" }
          }),
          prisma.systemSetting.findFirst({
            where: { key: "page_content_home" }
          }),
          prisma.conference.findFirst({
            where: { deletedAt: null },
            include: { venue: true }
          }),
          prisma.themeSetting.findFirst({
            where: { isActive: true }
          })
        ]);

        const mappedSpeakers = speakers.map((s) => ({
          id: s.id,
          name: s.name,
          role: s.role,
          topic: s.topic,
          bio: s.bio,
          imageAssetId: s.imageAsset?.storageKey || s.imageAssetId || null,
          organizationName: s.organization?.name ?? "N/A"
        }));

        const mappedTracks = tracks.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description
        }));

        const customContent = homeSetting?.value as unknown as Array<{
          id: string;
          name: string;
          visible?: boolean;
          fields: Record<string, string>;
        }>;

        const conferenceInfo: ConferenceInfo = {
          name: conf?.name || "ICGIT 2026",
          fullName: conf?.fullName || "International Conference on Global Innovation and Technology 2026",
          dates: conf?.startDate && conf?.endDate
            ? (() => {
                const s = new Date(conf.startDate);
                const e = new Date(conf.endDate);
                const sMonth = s.toLocaleDateString("en-US", { month: "long" });
                const eMonth = e.toLocaleDateString("en-US", { month: "long" });
                if (sMonth === eMonth && s.getFullYear() === e.getFullYear()) {
                  return `${sMonth} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`;
                }
                return `${sMonth} ${s.getDate()} – ${eMonth} ${e.getDate()}, ${e.getFullYear()}`;
              })()
            : "December 8–10, 2026",
          startDateIso: conf?.startDate ? conf.startDate.toISOString() : "2026-12-08T09:00:00Z",
          venueName: conf?.venue?.name || "Dubai World Trade Centre",
          venueAddress: conf?.venue?.address || "Sheikh Zayed Road",
          venueCity: conf?.venue?.city || "Dubai",
          mode: conf?.mode === "OFFLINE" ? "In-Person Event" : conf?.mode === "VIRTUAL" ? "Virtual Event" : "Hybrid Event"
        };

        return {
          mappedSpeakers,
          mappedTracks,
          customContent,
          conferenceInfo,
          themeTokens: activeTheme?.tokens as Record<string, string> | null
        };
      } catch (err) {
        console.error("HomePage DB fetch error:", err);
        return {
          mappedSpeakers: [],
          mappedTracks: [],
          customContent: undefined,
          conferenceInfo: undefined,
          themeTokens: null
        };
      }
    }
  );

  return (
    <HomeClient
      speakers={mappedSpeakers}
      tracks={mappedTracks}
      customContent={customContent}
      conferenceInfo={conferenceInfo}
      themeTokens={themeTokens}
    />
  );
}
