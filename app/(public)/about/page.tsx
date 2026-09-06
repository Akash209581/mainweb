import type { Metadata } from "next";
import { ShieldCheck, Cpu, Globe, GraduationCap, Calendar } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Section } from "@/components/common/section";
import { SectionHeader } from "@/components/common/section-header";
import { GlassCard } from "@/components/cards/glass-card";
import { prisma } from "@/lib/prisma/client";
import { memoize } from "@/lib/cache";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about the ICGIT 2026 mission, format, and program priorities."
};

export const dynamic = "force-dynamic";

const HIGHLIGHTS = [
  {
    title: "Double-Blind Review",
    desc: "Rigorous standards with at least two reviewers assigned per technical track submission.",
    icon: ShieldCheck
  },
  {
    title: "Hybrid Accessibility",
    desc: "Seamless live-streams and digital presentations for virtual delegates worldwide.",
    icon: Globe
  },
  {
    title: "Academic proceedings",
    desc: "Selected papers will be indexed in leading digital research databases.",
    icon: GraduationCap
  },
  {
    title: "December program",
    desc: "Three concentrated days of panels, presentations, keynotes, and network dinners.",
    icon: Calendar
  }
];

export default async function AboutPage() {
  const sections = await memoize("about_page_setting", 15000, async () => {
    const aboutSetting = await prisma.systemSetting.findFirst({
      where: { key: "page_content_about" }
    });
    return (aboutSetting?.value as unknown as Array<{ id: string; name: string; visible?: boolean; fields: Record<string, string>; }>) || [];
  });

  // Helper to extract fields for a section
  const getSectionFields = (sectionId: string) => {
    const sec = sections.find((s) => s.id === sectionId);
    return sec && sec.visible !== false ? sec.fields : null;
  };

  // Section 1: Header
  const headerFields = getSectionFields("about_header") || {
    eyebrow: "About",
    title: "A hybrid platform for technology leaders and researchers",
    description: "ICGIT 2026 is designed as a premium conference experience for global innovation exchange, combining in-person programming in Dubai with virtual access for international delegates."
  };

  // Section 2: Mission & Objectives
  const missionFields = getSectionFields("about_mission") || {
    title: "Aligning research with industrial application",
    paragraph: "The International Conference on Global Innovation and Technology 2026 is structured to foster collaboration between academic research networks, enterprise developers, and government policymakers.",
    missionTitle: "Mission Statement",
    missionDesc: "To provide a peer-reviewed, high-integrity platform that accelerates the deployment of sustainable, secure, and intelligent technologies worldwide.",
    visionTitle: "Vision",
    visionDesc: "A connected innovation ecosystem where emerging tech (AI, Blockchain, Green Computing) is safely standardized and scaled.",
    objectivesTitle: "Conference Objectives",
    objective1: "Peer review and publish 150+ papers in collaborative research fields.",
    objective2: "Host delegates from 80+ countries onsite and virtually.",
    objective3: "Convene strategy roundtables linking startups, researchers, and venture capitalists."
  };

  const showHeader = !sections.some((s) => s.id === "about_header" && s.visible === false);
  const showMission = !sections.some((s) => s.id === "about_mission" && s.visible === false);

  return (
    <>
      {showHeader && (
        <PageHeader
          eyebrow={headerFields.eyebrow}
          title={headerFields.title}
          description={headerFields.description}
        />
      )}
      
      {/* Introduction & Mission */}
      {showMission && (
        <Section className="pt-0">
          <div className="container grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <SectionHeader
                title={missionFields.title}
                align="left"
              />
              <p className="text-sm leading-7 text-muted text-justify">
                {missionFields.paragraph}
              </p>
              
              <div className="grid gap-4 sm:grid-cols-2 mt-6">
                <div className="rounded-lg border border-border/30 bg-surface/30 p-5">
                  <h3 className="font-heading text-md font-bold text-foreground">{missionFields.missionTitle}</h3>
                  <p className="mt-2 text-xs leading-5 text-muted">
                    {missionFields.missionDesc}
                  </p>
                </div>
                <div className="rounded-lg border border-border/30 bg-surface/30 p-5">
                  <h3 className="font-heading text-md font-bold text-foreground">{missionFields.visionTitle}</h3>
                  <p className="mt-2 text-xs leading-5 text-muted">
                    {missionFields.visionDesc}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-border/30 bg-surface/30 p-5 mt-4">
                <h3 className="font-heading text-md font-bold text-foreground">{missionFields.objectivesTitle}</h3>
                <ul className="mt-3 space-y-2 text-xs text-muted list-disc pl-4">
                  {missionFields.objective1 && <li>{missionFields.objective1}</li>}
                  {missionFields.objective2 && <li>{missionFields.objective2}</li>}
                  {missionFields.objective3 && <li>{missionFields.objective3}</li>}
                </ul>
              </div>
            </div>

            {/* Graphic Side Card */}
            <div className="relative flex items-center justify-center">
              <div className="relative w-full aspect-video rounded-xl overflow-hidden glass-panel border border-border/40 p-5 bg-surface/30">
                <div className="absolute inset-0 bg-gradient-to-tr from-accent/10 via-primary/5 to-transparent pointer-events-none" />
                <div className="relative h-full flex flex-col justify-between z-10">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono text-accent">STATUS: READY</span>
                    <span className="text-[10px] font-mono text-muted">PORT: 5433</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Cpu className="size-10 text-accent animate-pulse" />
                    <span className="mt-2 font-heading text-lg font-bold text-foreground">ICGIT 2026 CORE</span>
                  </div>
                  <div className="flex justify-between items-end text-[9px] text-muted">
                    <span>DECEMBER 8-10, 2026</span>
                    <span>DUBAI, UAE</span>
                  </div>
                </div>
                {/* Overlay dashed mesh */}
                <div className="absolute inset-0 border border-dashed border-border/20 m-6 pointer-events-none" />
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* Program Priorities Highlights */}
      <Section className="border-t border-border/40 bg-surface/5">
        <SectionHeader
          eyebrow="Key Details"
          title="Program design and values"
          description="We focus on providing a structured environment where quality peer review and accessible networking thrive."
        />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((h) => {
            const Icon = h.icon;
            return (
              <GlassCard key={h.title} className="flex flex-col justify-between">
                <div className="flex size-10 items-center justify-center rounded-lg bg-accent/15 text-accent mb-4">
                  <Icon className="size-5" />
                </div>
                <div>
                  <h3 className="font-heading text-md font-bold text-foreground">{h.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-muted">{h.desc}</p>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </Section>
    </>
  );
}
