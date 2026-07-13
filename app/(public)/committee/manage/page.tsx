import type { Metadata } from "next";
import { prisma } from "@/lib/prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { PageHeader } from "@/components/common/page-header";
import { Section } from "@/components/common/section";
import { CommitteeWorkspace } from "./committee-workspace";

export const metadata: Metadata = {
  title: "Committee Workspace",
  description: "ICGIT 2026 Committee Review progress, conflict alerts, and Decisions."
};

export const dynamic = "force-dynamic";

export default async function CommitteeManagePage() {
  await requireRole(["COMMITTEE_MEMBER", "ADMIN", "SUPER_ADMIN"]);

  const submissions = await prisma.abstractSubmission.findMany({
    where: { deletedAt: null },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profile: {
            select: {
              organization: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      },
      track: {
        select: {
          name: true
        }
      },
      assignments: {
        where: { deletedAt: null },
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profile: {
                select: {
                  organization: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      },
      reviews: {
        where: { deletedAt: null },
        include: {
          reviewer: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          scores: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const mappedSubmissions = submissions.map(s => ({
    id: s.id,
    title: s.title,
    status: s.status,
    authorName: `${s.author.firstName ?? ""} ${s.author.lastName ?? ""}`.trim() || s.author.email,
    authorOrg: s.author.profile?.organization?.name ?? "N/A",
    authorEmail: s.author.email,
    trackName: s.track?.name ?? "Other",
    assignments: s.assignments.map(a => ({
      id: a.id,
      reviewerId: a.reviewer.id,
      reviewerName: `${a.reviewer.firstName ?? ""} ${a.reviewer.lastName ?? ""}`.trim() || a.reviewer.email,
      reviewerOrg: a.reviewer.profile?.organization?.name ?? "N/A",
      reviewerEmail: a.reviewer.email,
      completed: !!a.completedAt
    })),
    reviews: s.reviews.map(r => ({
      id: r.id,
      reviewerName: `${r.reviewer.firstName ?? ""} ${r.reviewer.lastName ?? ""}`.trim() || r.reviewer.email,
      recommendation: r.recommendation,
      comments: r.comments,
      scores: r.scores.map((sc: { criterion: string; score: number }) => ({
        criterion: sc.criterion,
        score: sc.score
      }))
    }))
  }));

  return (
    <>
      <PageHeader
        eyebrow="Committee Platform"
        title="Committee Decisions & Conflict Center"
        description="Inspect technical evaluations, verify institutional conflicts, and record paper outcomes."
      />
      <Section className="pt-0">
        <CommitteeWorkspace submissions={mappedSubmissions} />
      </Section>
    </>
  );
}
