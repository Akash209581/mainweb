import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { Section } from "@/components/common/section";
import { listAgenda } from "@/lib/repositories/public-content.repository";
import { ScheduleLayout } from "./schedule-layout";

export const metadata: Metadata = {
  title: "Schedule",
  description: "Explore the three-day ICGIT 2026 conference schedule."
};

export default async function SchedulePage() {
  // Fetch all agenda items chronologically
  const { items } = await listAgenda({
    page: 1,
    pageSize: 100,
    direction: "asc"
  });

  // Map database items to simple client structures
  const mappedItems = items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description ?? "",
    startsAt: item.startsAt.toISOString(),
    endsAt: item.endsAt.toISOString(),
    location: item.location ?? "TBA",
    dayId: item.agendaDayId,
    dayTitle: item.agendaDay.title,
    dayDate: item.agendaDay.date.toISOString(),
    track: item.session?.trackId ? "AI & Systems" : "General"
  }));

  // Group agenda days
  const daysMap: Record<string, { id: string; title: string; date: string }> = {};
  mappedItems.forEach((item) => {
    if (!daysMap[item.dayId]) {
      daysMap[item.dayId] = {
        id: item.dayId,
        title: item.dayTitle,
        date: item.dayDate
      };
    }
  });

  const sortedDays = Object.values(daysMap).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <>
      <PageHeader
        eyebrow="Schedule"
        title="Three days of research, strategy, and partnership"
        description="The agenda balances keynotes, research tracks, sponsor showcases, committee sessions, and networking formats across the hybrid conference."
      />
      <Section className="pt-0">
        <ScheduleLayout initialItems={mappedItems} days={sortedDays} />
      </Section>
    </>
  );
}
