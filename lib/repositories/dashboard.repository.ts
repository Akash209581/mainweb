import { prisma } from "@/lib/prisma/client";

export async function getDashboardMetrics() {
  const [
    users,
    speakers,
    sponsors,
    registrations,
    submissions,
    reviews,
    payments,
    announcements
  ] = await prisma.$transaction([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.speaker.count({ where: { deletedAt: null } }),
    prisma.sponsor.count({ where: { deletedAt: null } }),
    prisma.registration.count({ where: { deletedAt: null } }),
    prisma.abstractSubmission.count({ where: { deletedAt: null } }),
    prisma.review.count({ where: { deletedAt: null } }),
    prisma.payment.count({ where: { deletedAt: null } }),
    prisma.announcement.count({ where: { deletedAt: null } })
  ]);

  return { users, speakers, sponsors, registrations, submissions, reviews, payments, announcements };
}

export async function getAdminDashboardStats() {
  const [
    totalRegistrations,
    abstractSubmissions,
    acceptedPapers,
    pendingReviews,
    speakers,
    sponsors,
    revenueData,
    recentActivity,
    allRegistrations,
    allSubmissions
  ] = await prisma.$transaction([
    // 1. Core counters
    prisma.registration.count({ where: { deletedAt: null } }),
    prisma.abstractSubmission.count({ where: { deletedAt: null } }),
    prisma.abstractSubmission.count({ where: { status: "ACCEPTED", deletedAt: null } }),
    prisma.review.count({ where: { deletedAt: null } }), 
    prisma.speaker.count({ where: { deletedAt: null } }),
    prisma.sponsor.count({ where: { deletedAt: null } }),
    
    // 2. Paid Revenue (in cents)
    prisma.payment.aggregate({
      _sum: { amountCents: true },
      where: { status: "PAID" }
    }),

    // 3. Recent audit activity
    prisma.auditLog.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    }),

    // 4. Load all registrations for Javascript metrics
    prisma.registration.findMany({
      where: { deletedAt: null },
      select: {
        createdAt: true,
        countryId: true,
        country: {
          select: {
            name: true
          }
        }
      }
    }),

    // 5. Load all submissions for Javascript track metrics
    prisma.abstractSubmission.findMany({
      where: { deletedAt: null, trackId: { not: null } },
      select: {
        trackId: true
      }
    })
  ]);

  const revenue = (revenueData._sum.amountCents ?? 0) / 100;

  // 1. Count unique countries
  const countriesSet = new Set(allRegistrations.map(r => r.countryId).filter(Boolean));
  const uniqueCountriesCount = countriesSet.size;

  // 2. Calculate daily trends
  const trendMap: Record<string, number> = {};
  allRegistrations.forEach((r) => {
    const d = r.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    trendMap[d] = (trendMap[d] ?? 0) + 1;
  });
  const registrationsTrend = Object.entries(trendMap).map(([date, count]) => ({
    date,
    count
  }));

  // 3. Track map count
  const allTracks = await prisma.track.findMany({
    select: { id: true, name: true }
  });
  const trackMap = new Map(allTracks.map(t => [t.id, t.name]));

  const trackCounts: Record<string, number> = {};
  allSubmissions.forEach((s) => {
    const tid = s.trackId!;
    trackCounts[tid] = (trackCounts[tid] ?? 0) + 1;
  });

  const papersByTrack = allTracks.map(t => ({
    name: t.name,
    count: trackCounts[t.id] ?? 0
  }));

  // 4. Country map count
  const countryCounts: Record<string, number> = {};
  allRegistrations.forEach((r) => {
    const name = r.country?.name ?? "Other";
    countryCounts[name] = (countryCounts[name] ?? 0) + 1;
  });
  const registrationsByCountry = Object.entries(countryCounts).map(([name, count]) => ({
    name,
    count
  }));

  return {
    totalRegistrations,
    abstractSubmissions,
    acceptedPapers,
    pendingReviews,
    speakers,
    sponsors,
    countries: uniqueCountriesCount,
    revenue,
    recentActivity,
    registrationsTrend: registrationsTrend.slice(-7),
    papersByTrack,
    registrationsByCountry,
    acceptanceRate: abstractSubmissions > 0 ? Math.round((acceptedPapers / abstractSubmissions) * 100) : 0
  };
}
