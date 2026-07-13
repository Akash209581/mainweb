"use client";

import { useState } from "react";
import { Download, FileText, CheckCircle, ShieldCheck, Scale, MapPin } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/buttons/button";
import { GlassCard } from "@/components/cards/glass-card";
import { PageHeader } from "@/components/common/page-header";
import { Section } from "@/components/common/section";

export function BrochureLayout() {
  const [activeTab, setActiveTab] = useState("brochure");
  const reduceMotion = useReducedMotion();

  const handleDownload = () => {
    // Programmatic trigger of static resource download
    const link = document.createElement("a");
    link.href = "/resources/icgit-2026-brochure.txt";
    link.download = "icgit-2026-brochure.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <PageHeader
        eyebrow="Resources"
        title="Brochure & Author Guidelines"
        description="Download files, review submission templates, structural regulations, and presentation rules for ICGIT 2026."
      />
      <Section className="pt-0">
        {/* Resource Category Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-border/25 pb-6 mb-8">
          <button
            onClick={() => setActiveTab("brochure")}
            className={`focus-ring rounded-lg px-4 py-2.5 text-sm font-semibold transition duration-200 ${
              activeTab === "brochure"
                ? "bg-accent text-white shadow-soft"
                : "bg-surface/60 hover:bg-hover/10 text-muted border border-border/30"
            }`}
          >
            Brochure & Overview
          </button>
          <button
            onClick={() => setActiveTab("guidelines")}
            className={`focus-ring rounded-lg px-4 py-2.5 text-sm font-semibold transition duration-200 ${
              activeTab === "guidelines"
                ? "bg-accent text-white shadow-soft"
                : "bg-surface/60 hover:bg-hover/10 text-muted border border-border/30"
            }`}
          >
            Author Guidelines
          </button>
          <button
            onClick={() => setActiveTab("ethics")}
            className={`focus-ring rounded-lg px-4 py-2.5 text-sm font-semibold transition duration-200 ${
              activeTab === "ethics"
                ? "bg-accent text-white shadow-soft"
                : "bg-surface/60 hover:bg-hover/10 text-muted border border-border/30"
            }`}
          >
            Ethics & Peer Review
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "brochure" && (
            <motion.div
              key="brochure"
              initial={reduceMotion ? {} : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]"
            >
              {/* Left Column: Preview */}
              <div className="space-y-6">
                <GlassCard>
                  <h3 className="font-heading text-xl font-bold text-foreground">
                    Conference Overview & Objectives
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-muted">
                    The International Conference on Global Innovation and Technology 2026 brings together leading minds to address next-generation infrastructures. Taking place at the Dubai World Trade Centre in December 2026, the hybrid format guarantees global dissemination of critical technology findings.
                  </p>

                  <h4 className="mt-6 font-heading text-md font-semibold text-foreground">
                    Key Highlights in the Brochure
                  </h4>
                  <ul className="mt-3 grid gap-2.5 text-xs text-muted">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="size-4 shrink-0 text-success" />
                      <span>Detailed schedules of all Day 1, 2, and 3 parallel sessions.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="size-4 shrink-0 text-success" />
                      <span>Registration details for onsite and virtual delegate tiers.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="size-4 shrink-0 text-success" />
                      <span>Sponsorship benefits matrix for startup, corporate, and diamond partners.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="size-4 shrink-0 text-success" />
                      <span>Hotel partners, visa checklist, and Dubai tourism highlights.</span>
                    </li>
                  </ul>
                </GlassCard>

                <GlassCard>
                  <div className="flex items-center gap-2 text-foreground font-bold font-heading text-lg mb-4">
                    <MapPin className="size-5 text-accent" />
                    <span>Venue Location: Dubai World Trade Centre</span>
                  </div>
                  <p className="text-xs leading-5 text-muted">
                    DWTC is a premier global infrastructure hub located centrally in Dubai, hosting over 500 tech exhibitions annually. Direct metro connectivity makes access seamless for international delegates.
                  </p>
                </GlassCard>
              </div>

              {/* Right Column: Download & Checklist */}
              <div className="space-y-6">
                <GlassCard className="border-accent/35 bg-gradient-to-tr from-accent/5 to-transparent">
                  <FileText className="size-10 text-accent" aria-hidden="true" />
                  <h3 className="mt-5 font-heading text-xl font-bold text-foreground">
                    Download Official Brochure
                  </h3>
                  <p className="mt-3 text-xs leading-5 text-muted">
                    Download the complete digital PDF package (schedules, sponsorship forms, map coordinates, and presentation slots).
                  </p>
                  <Button onClick={handleDownload} className="mt-6 hover-lift w-full justify-center">
                    <Download className="size-4 mr-2" aria-hidden="true" />
                    Download PDF Brochure
                  </Button>
                </GlassCard>

                <GlassCard>
                  <h3 className="font-heading text-md font-bold text-foreground mb-4">
                    Author Readiness Checklist
                  </h3>
                  <div className="space-y-3 text-xs text-muted">
                    <div className="flex items-start gap-2">
                      <input type="checkbox" readOnly checked className="mt-0.5 rounded border-border" />
                      <span>Select target research track matching your abstract scope.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <input type="checkbox" readOnly checked className="mt-0.5 rounded border-border" />
                      <span>Format abstract text to strictly within 80-5000 characters.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <input type="checkbox" readOnly checked className="mt-0.5 rounded border-border" />
                      <span>Identify at least 1 and up to 8 comma-separated keywords.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <input type="checkbox" readOnly checked className="mt-0.5 rounded border-border" />
                      <span>Ensure your PDF manuscript contains no identifying author metadata (for double-blind review).</span>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </motion.div>
          )}

          {activeTab === "guidelines" && (
            <motion.div
              key="guidelines"
              initial={reduceMotion ? {} : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <GlassCard>
                <h3 className="font-heading text-xl font-bold text-foreground mb-4">
                  Paper Submission & Formatting Guidelines
                </h3>
                <div className="space-y-4 text-xs leading-6 text-muted">
                  <p>
                    <strong>Submission Rules:</strong> All paper contributions must represent original research findings that have not been published or submitted elsewhere. Submissions are made through the abstracts portal as double-blind PDFs.
                  </p>
                  <p>
                    <strong>Formatting Requirements:</strong> Manuscripts must be written in English and formatted strictly according to the two-column ICGIT conference template. A4 format should be utilized, with margins not less than 20mm.
                  </p>
                  <p>
                    <strong>Templates:</strong> We offer both LaTeX macro packages and Word document templates.
                  </p>
                  <div className="flex flex-wrap gap-3 mt-4">
                    <Button variant="outline" size="sm" onClick={handleDownload} className="hover-lift">
                      <Download className="size-3.5 mr-1.5" />
                      Word Template (.docx)
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload} className="hover-lift">
                      <Download className="size-3.5 mr-1.5" />
                      LaTeX Macro Package (.zip)
                    </Button>
                  </div>
                </div>
              </GlassCard>

              <GlassCard>
                <h3 className="font-heading text-md font-bold text-foreground mb-4">
                  Presentation Rules & Formats
                </h3>
                <div className="grid gap-5 sm:grid-cols-2 text-xs text-muted">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">Oral Presentations</h4>
                    <p className="leading-5">
                      Oral presentations are allotted 15 minutes total: 12 minutes for presentation slides and 3 minutes for Q&A from delegates and track chairs. Virtual presenters will stream live via the hub.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">Poster Presentations</h4>
                    <p className="leading-5">
                      Onsite posters must fit A0 dimensions (vertical layout). Virtual poster presentations are hosted in the virtual gallery as 3-minute pre-recorded pitches paired with PDF attachments.
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {activeTab === "ethics" && (
            <motion.div
              key="ethics"
              initial={reduceMotion ? {} : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="grid gap-6 md:grid-cols-2"
            >
              <GlassCard>
                <div className="flex items-center gap-2 font-heading text-lg font-bold text-foreground mb-4">
                  <Scale className="size-5 text-accent" />
                  <span>Publication Ethics Policy</span>
                </div>
                <div className="space-y-4 text-xs leading-5 text-muted">
                  <p>
                    <strong>Plagiarism & Integrity:</strong> ICGIT enforces a strict zero-tolerance policy for plagiarism, self-plagiarism, and duplicate submission. All manuscript uploads are run through automated text-matching software prior to review.
                  </p>
                  <p>
                    <strong>Co-Authorship:</strong> All listed co-authors must have contributed significantly to the research design or analysis and must explicitly approve the submission file.
                  </p>
                  <p>
                    <strong>Conflicts of Interest:</strong> Authors must disclose any commercial or funding alignments that could compromise review impartiality during the abstract submission process.
                  </p>
                </div>
              </GlassCard>

              <GlassCard>
                <div className="flex items-center gap-2 font-heading text-lg font-bold text-foreground mb-4">
                  <ShieldCheck className="size-5 text-accent" />
                  <span>Double-Blind Peer Review Process</span>
                </div>
                <div className="space-y-4 text-xs leading-5 text-muted">
                  <p>
                    <strong>Review Workflow:</strong> Every submitted abstract undergoes a double-blind peer review process conducted by at least two domain experts from the Technical Program Committee.
                  </p>
                  <p>
                    <strong>Evaluation Criteria:</strong> Submissions are scored on technical rigor, clarity of presentation, relevance to track themes, and original contribution.
                  </p>
                  <p>
                    <strong>Decision Framework:</strong> Accepted papers require positive recommendation scores and must address any reviewer comments in the final camera-ready revision.
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </Section>
    </>
  );
}
