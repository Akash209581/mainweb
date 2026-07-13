import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";

export interface QueryOptions {
  page: number;
  pageSize: number;
  search?: string;
  direction: "asc" | "desc";
}

function offset({ page, pageSize }: QueryOptions): number {
  return (page - 1) * pageSize;
}

export async function listSpeakers(options: QueryOptions) {
  const where: Prisma.SpeakerWhereInput = {
    deletedAt: null,
    ...(options.search
      ? {
          OR: [
            { name: { contains: options.search, mode: "insensitive" } },
            { role: { contains: options.search, mode: "insensitive" } },
            { topic: { contains: options.search, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const [items, total] = await Promise.all([
    prisma.speaker.findMany({
      where,
      orderBy: [{ sortOrder: options.direction }, { name: "asc" }],
      skip: offset(options),
      take: options.pageSize,
      include: { organization: true }
    }),
    prisma.speaker.count({ where })
  ]);

  return { items, total, page: options.page, pageSize: options.pageSize };
}

export async function listAgenda(options: QueryOptions) {
  const where: Prisma.AgendaItemWhereInput = {
    deletedAt: null,
    ...(options.search
      ? {
          OR: [
            { title: { contains: options.search, mode: "insensitive" } },
            { description: { contains: options.search, mode: "insensitive" } },
            { location: { contains: options.search, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const [items, total] = await Promise.all([
    prisma.agendaItem.findMany({
      where,
      orderBy: [{ startsAt: options.direction }, { sortOrder: "asc" }],
      skip: offset(options),
      take: options.pageSize,
      include: { agendaDay: true, session: true }
    }),
    prisma.agendaItem.count({ where })
  ]);

  return { items, total, page: options.page, pageSize: options.pageSize };
}

export async function listTracks(options: QueryOptions) {
  const where: Prisma.TrackWhereInput = {
    deletedAt: null,
    ...(options.search
      ? {
          OR: [
            { name: { contains: options.search, mode: "insensitive" } },
            { description: { contains: options.search, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const [items, total] = await Promise.all([
    prisma.track.findMany({
      where,
      orderBy: { name: options.direction },
      skip: offset(options),
      take: options.pageSize
    }),
    prisma.track.count({ where })
  ]);

  return { items, total, page: options.page, pageSize: options.pageSize };
}

export async function listSponsors(options: QueryOptions) {
  const where: Prisma.SponsorWhereInput = {
    deletedAt: null,
    ...(options.search
      ? {
          OR: [
            { name: { contains: options.search, mode: "insensitive" } },
            { focus: { contains: options.search, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const [items, total] = await Promise.all([
    prisma.sponsor.findMany({
      where,
      orderBy: [{ sortOrder: options.direction }, { name: "asc" }],
      skip: offset(options),
      take: options.pageSize,
      include: { sponsorTier: true }
    }),
    prisma.sponsor.count({ where })
  ]);

  return { items, total, page: options.page, pageSize: options.pageSize };
}

export async function listCommittee(options: QueryOptions) {
  const where: Prisma.CommitteeMemberWhereInput = {
    deletedAt: null,
    ...(options.search
      ? {
          OR: [
            { name: { contains: options.search, mode: "insensitive" } },
            { role: { contains: options.search, mode: "insensitive" } },
            { affiliation: { contains: options.search, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const [items, total] = await Promise.all([
    prisma.committeeMember.findMany({
      where,
      orderBy: [{ sortOrder: options.direction }, { name: "asc" }],
      skip: offset(options),
      take: options.pageSize
    }),
    prisma.committeeMember.count({ where })
  ]);

  return { items, total, page: options.page, pageSize: options.pageSize };
}
