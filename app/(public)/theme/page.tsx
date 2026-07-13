"use client";

import { useTheme } from "@/hooks/use-theme";
import { CheckCircle, Eye, RefreshCw, Palette } from "lucide-react";
import { Button } from "@/components/buttons/button";
import { GlassCard } from "@/components/cards/glass-card";
import { PageHeader } from "@/components/common/page-header";
import { Section } from "@/components/common/section";
import type { ThemeId } from "@/types/theme";

const THEME_PREVIEWS = [
  {
    id: "tech-ai" as ThemeId,
    name: "Tech & AI Theme",
    description: "Dark navy with purple, blue, and cyan accents. Perfect for artificial intelligence, Web3, and edge computing.",
    gradient: "from-[#7c5cff] via-[#1ed5ff] to-[#38bdf8]",
    accentColor: "bg-[#7c5cff]",
    borderColor: "border-[#7c5cff]/30",
    glowColor: "shadow-[#7c5cff]/10"
  },
  {
    id: "health-bio" as ThemeId,
    name: "Health & Bio Theme",
    description: "Deep emerald with mint and teal highlights. Designed for biochemistry, bioinformatics, and health technology.",
    gradient: "from-[#10b981] via-[#34d399] to-[#6ee7b7]",
    accentColor: "bg-[#10b981]",
    borderColor: "border-[#10b981]/30",
    glowColor: "shadow-[#10b981]/10"
  },
  {
    id: "corporate" as ThemeId,
    name: "Corporate Theme",
    description: "Dark slate with royal and sky blue highlights. Structured for enterprise integrations, government councils, and strategy sessions.",
    gradient: "from-[#2563eb] via-[#3b82f6] to-[#7dd3fc]",
    accentColor: "bg-[#2563eb]",
    borderColor: "border-[#2563eb]/30",
    glowColor: "shadow-[#2563eb]/10"
  }
];

export default function ThemeSettingsPage() {
  const { theme: activeTheme, setTheme } = useTheme();

  return (
    <>
      <PageHeader
        eyebrow="Preferences"
        title="Theme Settings"
        description="Select a theme template to customize the conference platform aesthetics instantly."
      />
      <Section className="pt-0">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Theme Cards List */}
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-3">
              {THEME_PREVIEWS.map((t) => {
                const isActive = activeTheme === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`cursor-pointer rounded-xl border p-5 transition duration-300 flex flex-col justify-between hover:border-border/60 ${
                      isActive
                        ? "border-accent bg-accent/5 ring-1 ring-accent"
                        : "border-border/30 bg-surface/30"
                    }`}
                  >
                    <div>
                      <div className={`h-3 w-full rounded-full bg-gradient-to-r ${t.gradient} mb-4`} />
                      <h3 className="font-heading text-md font-bold text-foreground">
                        {t.name}
                      </h3>
                      <p className="mt-2 text-[11px] leading-relaxed text-muted">
                        {t.description}
                      </p>
                    </div>

                    <div className="mt-6 flex justify-end">
                      {isActive ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-accent uppercase tracking-wider">
                          <CheckCircle className="size-3.5" /> Applied
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted font-medium uppercase tracking-wider">
                          Apply Theme
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Simulated Live Preview Area */}
            <GlassCard className="p-6 md:p-8">
              <div className="flex items-center gap-2 text-foreground font-bold font-heading text-lg mb-6">
                <Eye className="size-5 text-accent animate-pulse" />
                <span>Live Component Mockup Preview</span>
              </div>

              <div className="space-y-6 rounded-lg border border-border/30 bg-surface/30 p-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent">
                      HYBRID CONFERENCE
                    </span>
                    <span className="text-[10px] text-muted font-semibold">DUBAI 2026</span>
                  </div>
                  <h4 className="font-heading text-xl font-bold text-foreground">
                    This Heading inherits theme styling
                  </h4>
                  <p className="text-xs leading-5 text-muted max-w-lg">
                    This card acts as a real-time preview of how buttons, links, and borders appear on other dashboard pages.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button className="hover-lift">Primary Call-to-Action</Button>
                  <Button variant="outline" className="hover-lift">Secondary Action</Button>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Theme Logic Sidebar */}
          <div className="space-y-6">
            <GlassCard>
              <Palette className="size-10 text-accent" />
              <h3 className="mt-5 font-heading text-lg font-bold text-foreground">
                Immediate Execution
              </h3>
              <p className="mt-2 text-xs leading-5 text-muted">
                Selecting a theme card sets the document datasets data-theme attribute instantly, updating primary tailwind variables, particle graphics, and glows.
              </p>
            </GlassCard>

            <GlassCard>
              <RefreshCw className="size-10 text-accent animate-spin-slow" />
              <h3 className="mt-5 font-heading text-lg font-bold text-foreground">
                Persistent Storage
              </h3>
              <p className="mt-2 text-xs leading-5 text-muted">
                Your selection is saved inside LocalStorage under the key &ldquo;icgit-theme&rdquo;, ensuring it remains persistent across hard page refreshes and server rebuilds.
              </p>
            </GlassCard>
          </div>
        </div>
      </Section>
    </>
  );
}
