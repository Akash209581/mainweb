import { CheckCircle2 } from "lucide-react";
import { GlassCard } from "@/components/cards/glass-card";
import type { AgendaItem } from "@/types/conference";

interface AgendaCardProps {
  item: AgendaItem;
}

export function AgendaCard({ item }: AgendaCardProps) {
  return (
    <GlassCard className="h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
            {item.day}
          </p>
          <h3 className="mt-2 font-heading text-2xl font-semibold text-foreground">
            {item.title}
          </h3>
        </div>
        <p className="rounded-full border border-border/50 px-3 py-1 text-xs text-muted">
          {item.date}
        </p>
      </div>
      <ul className="mt-6 space-y-3">
        {item.sessions.map((session) => (
          <li key={session} className="flex gap-3 text-sm text-muted">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
            <span>{session}</span>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
