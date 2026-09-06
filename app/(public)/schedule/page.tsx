import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { Section } from "@/components/common/section";
import { listAgenda } from "@/lib/repositories/public-content.repository";
import { ScheduleLayout } from "./schedule-layout";

export const metadata: Metadata = {
  title: "Schedule",
  description: "Explore the three-day ICGIT 2026 conference schedule."
};

export const dynamic = "force-dynamic";

const DEFAULT_AGENDA_DAYS = [
  { id: "day-1", title: "Day 1: Global Innovation Strategy", date: "2026-12-08T09:00:00.000Z" },
  { id: "day-2", title: "Day 2: Research & Applied Technology", date: "2026-12-09T09:00:00.000Z" },
  { id: "day-3", title: "Day 3: Future Systems & Partnerships", date: "2026-12-10T09:00:00.000Z" }
];

const DEFAULT_SCHEDULE_ITEMS = [
  {
    id: "item-101",
    title: "Opening Ceremony & Strategic Keynote",
    description: "Welcome address by Conference General Chairs and governmental technology leaders.",
    startsAt: "2026-12-08T09:00:00.000Z",
    endsAt: "2026-12-08T10:30:00.000Z",
    location: "Main Auditorium (Sheikh Maktoum Hall)",
    dayId: "day-1",
    dayTitle: "Day 1: Global Innovation Strategy",
    dayDate: "2026-12-08T09:00:00.000Z",
    track: "Keynote"
  },
  {
    id: "item-102",
    title: "AI Ecosystems & Policy Roundtable",
    description: "Executive discussion on cross-border artificial intelligence standards and infrastructure.",
    startsAt: "2026-12-08T11:00:00.000Z",
    endsAt: "2026-12-08T12:30:00.000Z",
    location: "Hall B - Room 102",
    dayId: "day-1",
    dayTitle: "Day 1: Global Innovation Strategy",
    dayDate: "2026-12-08T09:00:00.000Z",
    track: "AI & Systems"
  },
  {
    id: "item-201",
    title: "Parallel Research Paper Sessions: Deep Tech & Robotics",
    description: "Oral presentations of peer-reviewed papers by international academic authors.",
    startsAt: "2026-12-09T09:30:00.000Z",
    endsAt: "2026-12-09T12:00:00.000Z",
    location: "Symposium Hall C",
    dayId: "day-2",
    dayTitle: "Day 2: Research & Applied Technology",
    dayDate: "2026-12-09T09:00:00.000Z",
    track: "AI & Systems"
  },
  {
    id: "item-202",
    title: "Enterprise Technology Showcase & Sponsor Networking",
    description: "Interactive demonstrations from industry partners and startup innovators.",
    startsAt: "2026-12-09T14:00:00.000Z",
    endsAt: "2026-12-09T16:30:00.000Z",
    location: "Exhibition Concourse",
    dayId: "day-2",
    dayTitle: "Day 2: Research & Applied Technology",
    dayDate: "2026-12-09T09:00:00.000Z",
    track: "General"
  },
  {
    id: "item-301",
    title: "Future Partnerships Plenary & Closing Banquet",
    description: "Best Paper awards presentation, joint venture announcements, and closing banquet.",
    startsAt: "2026-12-10T10:00:00.000Z",
    endsAt: "2026-12-10T13:00:00.000Z",
    location: "Main Auditorium (Sheikh Maktoum Hall)",
    dayId: "day-3",
    dayTitle: "Day 3: Future Systems & Partnerships",
    dayDate: "2026-12-10T09:00:00.000Z",
    track: "Keynote"
  }
];

export default async function SchedulePage() {
  // Fetch all agenda items chronologically
  const { items } = await listAgenda({
    page: 1,
    pageSize: 100,
    direction: "asc"
  });

  // Map database items to simple client structures
  const mappedItems =
    items.length > 0
      ? items.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description ?? "",
          startsAt: item.startsAt.toISOString(),
          endsAt: item.endsAt.toISOString(),
          location: item.location ?? "TBA",
          dayId: item.agendaDayId,
          dayTitle: item.agendaDay?.title || "Day 1",
          dayDate: item.agendaDay?.date ? item.agendaDay.date.toISOString() : "2026-12-08T09:00:00.000Z",
          track: item.session?.trackId ? "AI & Systems" : "General"
        }))
      : DEFAULT_SCHEDULE_ITEMS;

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

  const sortedDays =
    Object.values(daysMap).length > 0
      ? Object.values(daysMap).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )
      : DEFAULT_AGENDA_DAYS;

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
