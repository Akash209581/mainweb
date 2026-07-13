import { Mic2 } from "lucide-react";
import { GlassCard } from "@/components/cards/glass-card";
import type { Speaker } from "@/types/conference";

interface SpeakerCardProps {
  speaker: Speaker;
}

export function SpeakerCard({ speaker }: SpeakerCardProps) {
  return (
    <GlassCard className="h-full">
      <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-secondary/15 text-accent">
        <Mic2 className="size-7" aria-hidden="true" />
      </div>
      <h3 className="font-heading text-xl font-semibold text-foreground">{speaker.name}</h3>
      <p className="mt-1 text-sm font-medium text-accent">{speaker.role}</p>
      <p className="mt-1 text-sm text-muted">{speaker.organization}</p>
      <p className="mt-5 border-t border-border/35 pt-5 text-sm leading-7 text-muted">
        {speaker.topic}
      </p>
    </GlassCard>
  );
}
