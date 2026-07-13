"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { updateAbstractStatusAction } from "@/actions/abstract.actions";
import type { SubmissionStatus } from "@prisma/client";

interface ReviewerRef {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerOrg: string;
  reviewerEmail: string;
  completed: boolean;
}

interface ScoreInfo {
  criterion: string;
  score: number;
}

interface ReviewDetail {
  id: string;
  reviewerName: string;
  recommendation: string;
  comments: string;
  scores: ScoreInfo[];
}

interface SubmissionRow {
  id: string;
  title: string;
  status: SubmissionStatus;
  authorName: string;
  authorOrg: string;
  authorEmail: string;
  trackName: string;
  assignments: ReviewerRef[];
  reviews: ReviewDetail[];
}

interface CommitteeWorkspaceProps {
  submissions: SubmissionRow[];
}

const STATUSES: SubmissionStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "ACCEPTED",
  "REJECTED",
  "REVISION_REQUIRED"
];

export function CommitteeWorkspace({ submissions }: CommitteeWorkspaceProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; ok: boolean; msg: string } | null>(null);
  
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (abstractId: string, nextStatus: SubmissionStatus) => {
    setUpdatingId(abstractId);
    setFeedback(null);

    startTransition(async () => {
      try {
        const res = await updateAbstractStatusAction(abstractId, nextStatus);
        setFeedback({ id: abstractId, ok: res.ok, msg: res.message });
      } catch (err) {
        setFeedback({ id: abstractId, ok: false, msg: "Failed to update status." });
      } finally {
        setUpdatingId(null);
      }
    });
  };

  // Helper to detect conflicts between author and assigned reviewers
  const checkConflicts = (sub: SubmissionRow) => {
    const conflicts: string[] = [];

    sub.assignments.forEach((a) => {
      const authorOrg = sub.authorOrg.toLowerCase().trim();
      const reviewerOrg = a.reviewerOrg.toLowerCase().trim();
      
      const authorDomain = sub.authorEmail.split("@")[1]?.toLowerCase().trim();
      const reviewerDomain = a.reviewerEmail.split("@")[1]?.toLowerCase().trim();

      const ignoredDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"];

      if (
        authorOrg && 
        reviewerOrg && 
        authorOrg !== "n/a" && 
        reviewerOrg !== "n/a" && 
        authorOrg === reviewerOrg
      ) {
        conflicts.push(`Same organization (${a.reviewerOrg}) with reviewer ${a.reviewerName}`);
      }

      if (
        authorDomain && 
        reviewerDomain && 
        authorDomain === reviewerDomain && 
        !ignoredDomains.includes(authorDomain)
      ) {
        conflicts.push(`Same email domain (@${authorDomain}) with reviewer ${a.reviewerName}`);
      }
    });

    return conflicts;
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel overflow-x-auto rounded-xl border border-border/30">
        <table className="w-full text-left text-sm text-muted">
          <thead className="bg-surface/50 text-xs font-semibold text-foreground uppercase tracking-wider border-b border-border/30">
            <tr>
              <th className="px-6 py-4">Abstract & Track</th>
              <th className="px-6 py-4">Review Progress & Scores</th>
              <th className="px-6 py-4">Alerts & Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-xs text-muted italic">
                  No submissions recorded.
                </td>
              </tr>
            ) : (
              submissions.map((s) => {
                const isUpdating = updatingId === s.id;
                const rowFeedback = feedback?.id === s.id ? feedback : null;
                const conflicts = checkConflicts(s);

                // Calculate average scores
                const allScores = s.reviews.flatMap(r => r.scores.map(sc => sc.score));
                const averageScore = allScores.length > 0 
                  ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1)
                  : "N/A";

                return (
                  <tr key={s.id} className="hover:bg-hover/5 transition align-top">
                    {/* Paper & Track columns */}
                    <td className="px-6 py-4 max-w-sm">
                      <p className="font-semibold text-foreground leading-normal">{s.title}</p>
                      <p className="text-[10px] text-accent uppercase font-bold tracking-wider mt-1">{s.trackName}</p>
                      <p className="text-[11px] text-muted mt-2">Author: <strong>{s.authorName}</strong> ({s.authorOrg})</p>
                    </td>

                    {/* Reviewer Aggregations */}
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-medium text-foreground">Avg Evaluation Score:</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            averageScore !== "N/A" && Number(averageScore) >= 4.0 
                              ? "bg-success/15 text-success border border-success/30" 
                              : "bg-surface border border-border/40 text-foreground"
                          }`}>
                            {averageScore}
                          </span>
                        </div>

                        {s.reviews.length > 0 ? (
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Recommendations:</p>
                            <div className="flex flex-wrap gap-1">
                              {s.reviews.map((r, idx) => (
                                <span key={idx} className="inline-flex rounded border border-border/40 bg-surface/50 px-2 py-0.5 text-[9px] text-muted">
                                  {r.reviewerName}: {r.recommendation}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-muted italic">No evaluations completed yet.</p>
                        )}
                      </div>
                    </td>

                    {/* Conflict Warnings & Actions */}
                    <td className="px-6 py-4">
                      <div className="space-y-3">
                        {conflicts.map((conf) => (
                          <div key={conf} className="flex items-start gap-1.5 text-xs text-error font-semibold bg-danger/5 border border-danger/25 p-2 rounded">
                            <AlertTriangle className="size-3.5 shrink-0 mt-0.5 animate-pulse" />
                            <span>{conf}</span>
                          </div>
                        ))}

                        <div className="flex items-center gap-2">
                          <select
                            value={s.status}
                            disabled={isUpdating}
                            onChange={(e) => handleStatusChange(s.id, e.target.value as SubmissionStatus)}
                            className="focus-ring rounded border border-border/40 bg-surface px-2.5 py-1 text-xs text-foreground font-semibold"
                          >
                            {STATUSES.map((stat) => (
                              <option key={stat} value={stat}>
                                {stat.replace("_", " ")}
                              </option>
                            ))}
                          </select>
                          {isUpdating && <Loader2 className="size-3.5 text-accent animate-spin" />}
                        </div>

                        {rowFeedback && (
                          <p className={`text-[10px] font-semibold block ${rowFeedback.ok ? "text-success" : "text-error"}`}>
                            {rowFeedback.msg}
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
