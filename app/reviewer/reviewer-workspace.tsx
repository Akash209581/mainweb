"use client";

import { useState, useTransition } from "react";
import { Sparkles, FileText, CheckCircle, HelpCircle, Star, PenTool } from "lucide-react";
import { GlassCard } from "@/components/cards/glass-card";
import { Button } from "@/components/buttons/button";
import { submitPaperReviewAction } from "@/actions/review.actions";

interface ScoreInfo {
  criterion: string;
  score: number;
}

interface AbstractInfo {
  id: string;
  title: string;
  abstractText: string;
  keywords: string[];
  trackName: string;
  authorName: string;
}

interface ReviewInfo {
  recommendation: string;
  comments: string;
  scores: ScoreInfo[];
}

interface AssignmentRow {
  id: string;
  completed: boolean;
  completedAt: string | null;
  abstract: AbstractInfo;
  review: ReviewInfo | null;
}

interface ReviewerWorkspaceProps {
  assignments: AssignmentRow[];
}

export function ReviewerWorkspace({ assignments }: ReviewerWorkspaceProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    assignments.find(a => !a.completed)?.id || assignments[0]?.id || null
  );
  
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedAssignment = assignments.find(a => a.id === selectedId);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);
    if (!selectedId) return;

    const formData = new FormData(e.currentTarget);
    formData.append("assignmentId", selectedId);

    startTransition(async () => {
      try {
        const res = await submitPaperReviewAction({ ok: false, message: "" }, formData);
        setFeedback({ ok: res.ok, msg: res.message });
      } catch (err) {
        setFeedback({ ok: false, msg: "Failed to submit review." });
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] items-start">
      
      {/* Left Column: List of Assignments */}
      <div className="space-y-6">
        <GlassCard className="p-4">
          <h3 className="font-heading text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Review Queue</h3>
          <div className="space-y-2">
            {assignments.length === 0 ? (
              <p className="text-xs text-muted italic">No paper assignments found.</p>
            ) : (
              assignments.map((a) => {
                const isSelected = a.id === selectedId;
                return (
                  <div
                    key={a.id}
                    onClick={() => {
                      setSelectedId(a.id);
                      setFeedback(null);
                    }}
                    className={`cursor-pointer rounded-lg border p-3.5 transition ${
                      isSelected
                        ? "border-accent bg-accent/5 ring-1 ring-accent"
                        : "border-border/20 bg-surface/30 hover:border-border/40"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[9px] font-mono font-bold text-accent uppercase tracking-wider">
                        {a.abstract.trackName}
                      </span>
                      {a.completed ? (
                        <span className="inline-flex items-center gap-1 rounded bg-success/15 px-2 py-0.5 border border-success/25 text-[8px] text-success font-bold uppercase tracking-wider">
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-warning/15 px-2 py-0.5 border border-warning/25 text-[8px] text-warning font-bold uppercase tracking-wider">
                          Pending
                        </span>
                      )}
                    </div>
                    <h4 className="font-heading text-xs font-bold text-foreground mt-2 line-clamp-2 leading-relaxed">
                      {a.abstract.title}
                    </h4>
                  </div>
                );
              })
            )}
          </div>
        </GlassCard>
      </div>

      {/* Right Column: Selected Assignment Workspace */}
      <div className="space-y-6">
        {selectedAssignment ? (
          <div className="grid gap-6">
            {/* Paper Overview Panel */}
            <GlassCard className="p-6 space-y-4">
              <div className="border-b border-border/20 pb-4">
                <span className="text-[10px] font-mono text-accent uppercase tracking-wider">
                  {selectedAssignment.abstract.trackName}
                </span>
                <h3 className="font-heading text-lg font-bold text-foreground mt-1 leading-snug">
                  {selectedAssignment.abstract.title}
                </h3>
                <p className="text-[11px] text-muted mt-2">
                  Author: <strong>{selectedAssignment.abstract.authorName}</strong>
                </p>
              </div>

              <div>
                <h4 className="text-[10px] uppercase font-bold text-muted tracking-wider mb-1.5">Abstract</h4>
                <p className="text-xs text-muted leading-relaxed whitespace-pre-wrap">
                  {selectedAssignment.abstract.abstractText}
                </p>
              </div>

              {selectedAssignment.abstract.keywords.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-muted tracking-wider mb-1.5">Keywords</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAssignment.abstract.keywords.map((kw) => (
                      <span key={kw} className="rounded bg-surface/50 border border-border/40 px-2 py-0.5 text-[10px] text-muted">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Review Scoring / Outcome Panel */}
            <GlassCard className="p-6">
              <h3 className="font-heading text-md font-bold text-foreground mb-6 flex items-center gap-2">
                <PenTool className="size-4 text-accent" /> Evaluation Assessment
              </h3>

              {feedback && (
                <div
                  className={`p-4 rounded-lg border text-xs font-semibold mb-6 ${
                    feedback.ok ? "border-success/35 bg-success/5 text-success" : "border-danger/35 bg-danger/5 text-danger"
                  }`}
                >
                  {feedback.msg}
                </div>
              )}

              {selectedAssignment.completed && selectedAssignment.review ? (
                // Completed review read-only history
                <div className="space-y-6 text-xs">
                  <div className="grid gap-4 sm:grid-cols-3">
                    {selectedAssignment.review.scores.map((s) => (
                      <div key={s.criterion} className="rounded-lg border border-border/20 bg-surface/30 p-3 text-center">
                        <span className="text-[9px] uppercase font-bold text-muted tracking-wider">{s.criterion}</span>
                        <div className="flex items-center justify-center gap-1 mt-2 text-foreground font-heading text-lg font-bold">
                          <Star className="size-4 text-accent fill-accent" /> {s.score} / 5
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted tracking-wider">Recommendation</span>
                    <p className="mt-1">
                      <span className="inline-flex rounded bg-accent/15 px-2 py-0.5 border border-accent/25 text-[10px] text-accent font-bold uppercase tracking-wider">
                        {selectedAssignment.review.recommendation.replace("_", " ")}
                      </span>
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted tracking-wider">Reviewer Comments</span>
                    <p className="mt-1 text-muted leading-relaxed whitespace-pre-wrap">
                      {selectedAssignment.review.comments}
                    </p>
                  </div>
                </div>
              ) : (
                // Evaluation form inputs
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-muted font-semibold mb-1.5 uppercase tracking-wider">Technical Rigor</label>
                      <select
                        required
                        name="technicalRigor"
                        className="focus-ring w-full rounded border border-border/40 bg-surface/50 p-2.5 text-foreground font-semibold"
                      >
                        <option value="5">5 - Excellent</option>
                        <option value="4">4 - Good</option>
                        <option value="3">3 - Satisfactory</option>
                        <option value="2">2 - Marginal</option>
                        <option value="1">1 - Poor</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-muted font-semibold mb-1.5 uppercase tracking-wider">Originality</label>
                      <select
                        required
                        name="originality"
                        className="focus-ring w-full rounded border border-border/40 bg-surface/50 p-2.5 text-foreground font-semibold"
                      >
                        <option value="5">5 - Excellent</option>
                        <option value="4">4 - Good</option>
                        <option value="3">3 - Satisfactory</option>
                        <option value="2">2 - Marginal</option>
                        <option value="1">1 - Poor</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-muted font-semibold mb-1.5 uppercase tracking-wider">Presentation Clarity</label>
                      <select
                        required
                        name="clarity"
                        className="focus-ring w-full rounded border border-border/40 bg-surface/50 p-2.5 text-foreground font-semibold"
                      >
                        <option value="5">5 - Excellent</option>
                        <option value="4">4 - Good</option>
                        <option value="3">3 - Satisfactory</option>
                        <option value="2">2 - Marginal</option>
                        <option value="1">1 - Poor</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-muted font-semibold mb-1 uppercase tracking-wider">Final Recommendation</label>
                    <select
                      required
                      name="recommendation"
                      className="focus-ring w-full rounded border border-border/40 bg-surface/50 p-2.5 text-foreground font-semibold"
                    >
                      <option value="ACCEPT">ACCEPT</option>
                      <option value="MINOR_REVISION">MINOR REVISION</option>
                      <option value="MAJOR_REVISION">MAJOR REVISION</option>
                      <option value="REJECT">REJECT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-muted font-semibold mb-1 uppercase tracking-wider">Comments for the Authors</label>
                    <textarea
                      required
                      name="comments"
                      rows={5}
                      placeholder="Outline technical limitations, suggestion tweaks, formatting issues..."
                      className="focus-ring w-full rounded border border-border/40 bg-surface/50 p-2.5 text-foreground leading-relaxed resize-none"
                    />
                  </div>

                  <div className="pt-4 border-t border-border/20 flex justify-end">
                    <Button type="submit" isLoading={isPending} className="hover-lift">
                      Submit Paper Evaluation
                    </Button>
                  </div>
                </form>
              )}
            </GlassCard>
          </div>
        ) : (
          <GlassCard className="p-8 text-center text-xs text-muted italic">
            Please select an abstract assignment from the queue list.
          </GlassCard>
        )}
      </div>
    </div>
  );
}
