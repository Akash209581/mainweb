import type { Metadata } from "next";
import { prisma } from "@/lib/prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { PageHeader } from "@/components/common/page-header";
import { Section } from "@/components/common/section";
import { ReviewerWorkspace } from "./reviewer-workspace";

export const metadata: Metadata = {
  title: "Reviewer Workspace",
  description: "ICGIT 2026 technical reviewer assignments and scoring."
};

export const dynamic = "force-dynamic";

export default async function ReviewerPage() {
  // 1. Double check reviewer credentials
  const user = await requireRole(["REVIEWER", "ADMIN", "SUPER_ADMIN"]);

  // 2. Fetch assignments mapped to this reviewer
  const assignments = await prisma.reviewerAssignment.findMany({
    where: {
      reviewerId: user.id,
      deletedAt: null
    },
    include: {
      abstractSubmission: {
        include: {
          author: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          track: {
            select: {
              name: true
            }
          }
        }
      },
      reviews: {
        where: { deletedAt: null },
        include: {
          scores: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const mappedAssignments = assignments.map((a) => ({
    id: a.id,
    completed: !!a.completedAt,
    completedAt: a.completedAt ? a.completedAt.toLocaleDateString() : null,
    abstract: {
      id: a.abstractSubmission.id,
      title: a.abstractSubmission.title,
      abstractText: a.abstractSubmission.abstractText,
      keywords: a.abstractSubmission.keywords,
      trackName: a.abstractSubmission.track?.name ?? "Other",
      authorName: `${a.abstractSubmission.author.firstName ?? ""} ${a.abstractSubmission.author.lastName ?? ""}`.trim() || a.abstractSubmission.author.email
    },
    review: a.reviews[0]
      ? {
          recommendation: a.reviews[0].recommendation,
          comments: a.reviews[0].comments,
          scores: a.reviews[0].scores.map(s => ({
            criterion: s.criterion,
            score: s.score
          }))
        }
      : null
  }));

  return (
    <>
      <PageHeader
        eyebrow="Reviewer Platform"
        title="Technical Review Workspace"
        description="Access research paper drafts assigned to you, provide quantitative scores, and document review comments."
      />
      <Section className="pt-0">
        <ReviewerWorkspace assignments={mappedAssignments} />
      </Section>
    </>
  );
}
