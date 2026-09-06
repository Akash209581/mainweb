import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { GlassCard } from "@/components/cards/glass-card";
import { PageHeader } from "@/components/common/page-header";
import { Section } from "@/components/common/section";
import { AbstractSubmissionForm } from "@/components/forms/abstract-submission-form";
import { listTracks } from "@/lib/repositories/public-content.repository";
import { prisma } from "@/lib/prisma/client";
import { memoize } from "@/lib/cache";

import { DEFAULT_COUNTRIES } from "@/constants/conference";
import { DEFAULT_FALLBACK_TRACKS } from "@/components/home/home-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Abstract Submission",
  description: "Prepare and submit research abstracts for ICGIT 2026."
};

export default async function AbstractsPage() {
  const { tracks, countries } = await memoize("abstracts_page_data", 15000, async () => {
    try {
      const [tracksResult, dbCountries] = await Promise.all([
        listTracks({
          page: 1,
          pageSize: 50,
          direction: "asc"
        }),
        prisma.country.findMany({
          orderBy: { name: "asc" }
        })
      ]);

      const trackList =
        tracksResult.items.length > 0
          ? tracksResult.items.map((t) => ({ id: t.id, name: t.name }))
          : DEFAULT_FALLBACK_TRACKS.map((t) => ({ id: t.id, name: t.name }));

      const countryList =
        dbCountries.length > 0
          ? dbCountries.map((c) => ({ id: c.id, name: c.name }))
          : DEFAULT_COUNTRIES;

      return { tracks: trackList, countries: countryList };
    } catch (err) {
      console.error("AbstractsPage DB error, falling back to defaults:", err);
      return {
        tracks: DEFAULT_FALLBACK_TRACKS.map((t) => ({ id: t.id, name: t.name })),
        countries: DEFAULT_COUNTRIES
      };
    }
  });

  return (
    <>
      <PageHeader
        eyebrow="Abstracts"
        title="Submit research for ICGIT 2026 tracks"
        description="Submit your abstracts to participate in oral presentations or poster sessions. Authors must submit original works for double-blind review."
      />
      <Section className="pt-0">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-6">
            <GlassCard>
              <FileText className="size-10 text-accent" aria-hidden="true" />
              <h2 className="mt-5 font-heading text-2xl font-semibold text-foreground">
                Submission Readiness
              </h2>
              <p className="mt-4 text-xs leading-6 text-muted">
                Ensure your abstract description is between 80 and 5000 characters and your keywords target at least one innovation track.
              </p>
            </GlassCard>

            <GlassCard>
              <h3 className="font-heading text-lg font-semibold text-foreground">Important Reminders</h3>
              <ul className="mt-3 space-y-2.5 text-xs text-muted list-disc pl-4">
                <li>Double-blind review requires removing author identifying text in the PDF.</li>
                <li>At least one author must register to present accepted papers.</li>
                <li>Direct questions to secretariat@icgit2026.org</li>
              </ul>
            </GlassCard>
          </div>
          
          <GlassCard className="p-6 md:p-8">
            <AbstractSubmissionForm
              tracks={tracks.map((t) => ({ id: t.id, name: t.name }))}
              countries={countries.map((c) => ({ id: c.id, name: c.name }))}
            />
          </GlassCard>
        </div>
      </Section>
    </>
  );
}
