import type { Metadata } from "next";
import { prisma } from "@/lib/prisma/client";
import { HomeClient, type ConferenceInfo, DEFAULT_FALLBACK_SPEAKERS, DEFAULT_FALLBACK_TRACKS } from "@/components/home/home-client";
import { memoize } from "@/lib/cache";

import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return memoize("home_metadata_live", 60000, async () => {
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
  });
}

export default async function HomePage() {
  const { mappedSpeakers, mappedTracks, customContent, conferenceInfo, themeTokens, committeeMembers } = await memoize(
    "home_page_data_live",
    60000,
    async () => {
      let savedSettings: {
        sections?: Array<{ id: string; name?: string; visible?: boolean; fields?: Record<string, string | undefined> }>;
        committee?: Array<{ id: string; name: string; role: string; published?: boolean; photo?: { url?: string } | null }>;
        speakers?: Array<{ id: string; name: string; role: string; organizationName?: string; topic?: string; bio?: string; published?: boolean; photo?: { url?: string } | null }>;
        tracks?: Array<{ id: string; name: string; summary?: string; description?: string; published?: boolean }>;
        conference?: { title?: string; dates?: string; venue?: string; deadline?: string; supportEmail?: string; phone?: string };
      } | null = null;

      try {
        const sf = path.join(process.cwd(), "storage", "settings.json");
        if (fs.existsSync(sf)) {
          savedSettings = JSON.parse(fs.readFileSync(sf, "utf8"));
        }
      } catch {}

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

        const dbMappedSpeakers =
          speakers.length > 0
            ? speakers.map((s) => ({
                id: s.id,
                name: s.name,
                role: s.role,
                topic: s.topic,
                bio: s.bio,
                imageAssetId: s.imageAsset?.storageKey || s.imageAssetId || null,
                organizationName: s.organization?.name ?? "Independent"
              }))
            : DEFAULT_FALLBACK_SPEAKERS;

        const settingsSpeakers =
          savedSettings?.speakers && Array.isArray(savedSettings.speakers) && savedSettings.speakers.length > 0
            ? savedSettings.speakers
                .filter((s) => s.published !== false)
                .map((s) => ({
                  id: s.id || s.name,
                  name: s.name,
                  role: s.role || "",
                  topic: s.topic || "",
                  bio: s.bio || "",
                  imageAssetId: s.photo?.url || null,
                  organizationName: s.organizationName || "Independent"
                }))
            : null;

        const mappedSpeakers = settingsSpeakers || dbMappedSpeakers;

        const dbMappedTracks =
          tracks.length > 0
            ? tracks.map((t) => ({
                id: t.id,
                name: t.name,
                description: t.description
              }))
            : DEFAULT_FALLBACK_TRACKS;

        const settingsTracks =
          savedSettings?.tracks && Array.isArray(savedSettings.tracks) && savedSettings.tracks.length > 0
            ? savedSettings.tracks
                .filter((t) => t.published !== false)
                .map((t) => ({
                  id: t.id || t.name,
                  name: t.name,
                  description: t.summary || t.description || ""
                }))
            : null;

        const mappedTracks = settingsTracks || dbMappedTracks;

        const customContent =
          savedSettings?.sections && savedSettings.sections.length > 0
            ? savedSettings.sections
            : (homeSetting?.value as unknown as Array<{
                id: string;
                name: string;
                visible?: boolean;
                fields: Record<string, string>;
              }>);

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
                return `${sMonth} ${s.getDate()} – ${eMonth} ${e.getDate()}, ${s.getFullYear()}`;
              })()
            : "December 8–10, 2026",
          startDateIso: conf?.startDate ? conf.startDate.toISOString() : "2026-12-08T09:00:00Z",
          venueName: conf?.venue?.name || "Dubai World Trade Centre",
          venueAddress: conf?.venue?.address || "Sheikh Zayed Road",
          venueCity: conf?.venue?.city || "Dubai",
          mode: conf?.mode === "OFFLINE" ? "In-Person Event" : conf?.mode === "VIRTUAL" ? "Virtual Event" : "Hybrid Event"
        };

        if (savedSettings?.conference) {
          if (savedSettings.conference.title) {
            conferenceInfo.fullName = savedSettings.conference.title;
            conferenceInfo.name = savedSettings.conference.title.split("—")[0].trim();
          }
          if (savedSettings.conference.dates) {
            conferenceInfo.dates = savedSettings.conference.dates;
          }
          if (savedSettings.conference.venue) {
            conferenceInfo.venueName = savedSettings.conference.venue;
            conferenceInfo.venueAddress = savedSettings.conference.venue;
          }
        }

        const committeeMembers = savedSettings?.committee
          ? savedSettings.committee.map((m: any) => ({
              ...m,
              photo: typeof m.photo === "object" && m.photo ? m.photo.url : (m.photo || null)
            }))
          : undefined;

        return {
          mappedSpeakers,
          mappedTracks,
          customContent,
          conferenceInfo,
          committeeMembers,
          themeTokens: activeTheme?.tokens as Record<string, string> | null
        };
      } catch (err) {
        console.error("HomePage DB fetch error:", err);

        const settingsSpeakers =
          savedSettings?.speakers && Array.isArray(savedSettings.speakers) && savedSettings.speakers.length > 0
            ? savedSettings.speakers
                .filter((s) => s.published !== false)
                .map((s) => ({
                  id: s.id || s.name,
                  name: s.name,
                  role: s.role || "",
                  topic: s.topic || "",
                  bio: s.bio || "",
                  imageAssetId: s.photo?.url || null,
                  organizationName: s.organizationName || "Independent"
                }))
            : DEFAULT_FALLBACK_SPEAKERS;

        const settingsTracks =
          savedSettings?.tracks && Array.isArray(savedSettings.tracks) && savedSettings.tracks.length > 0
            ? savedSettings.tracks
                .filter((t) => t.published !== false)
                .map((t) => ({
                  id: t.id || t.name,
                  name: t.name,
                  description: t.summary || t.description || ""
                }))
            : DEFAULT_FALLBACK_TRACKS;

        const fallbackConferenceInfo: ConferenceInfo = {
          name: savedSettings?.conference?.title ? savedSettings.conference.title.split("—")[0].trim() : "ICGIT 2026",
          fullName: savedSettings?.conference?.title || "International Conference on Global Innovation and Technology 2026",
          dates: savedSettings?.conference?.dates || "December 8–10, 2026",
          startDateIso: "2026-12-08T09:00:00Z",
          venueName: savedSettings?.conference?.venue || "Dubai World Trade Centre",
          venueAddress: savedSettings?.conference?.venue || "Sheikh Zayed Road",
          venueCity: "Dubai",
          mode: "Hybrid Event"
        };

        const committeeMembers = savedSettings?.committee
          ? savedSettings.committee.map((m: any) => ({
              ...m,
              photo: typeof m.photo === "object" && m.photo ? m.photo.url : (m.photo || null)
            }))
          : undefined;

        return {
          mappedSpeakers: settingsSpeakers,
          mappedTracks: settingsTracks,
          customContent: savedSettings?.sections || undefined,
          committeeMembers,
          conferenceInfo: fallbackConferenceInfo,
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
      committeeMembers={committeeMembers}
    />
  );
}
