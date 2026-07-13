import { BadgeCheck } from "lucide-react";
import { GlassCard } from "@/components/cards/glass-card";
import type { Sponsor } from "@/types/conference";

interface SponsorCardProps {
  sponsor: Sponsor;
}

export function SponsorCard({ sponsor }: SponsorCardProps) {
  return (
    <GlassCard className="h-full">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-heading text-xl font-semibold text-foreground">{sponsor.name}</h3>
        <BadgeCheck className="size-6 shrink-0 text-accent" aria-hidden="true" />
      </div>
      <p className="mt-4 inline-flex rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-accent">
        {sponsor.tier}
      </p>
      <p className="mt-5 text-sm leading-7 text-muted">{sponsor.focus}</p>
    </GlassCard>
  );
}
