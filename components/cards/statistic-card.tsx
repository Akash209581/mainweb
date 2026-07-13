import { GlassCard } from "@/components/cards/glass-card";
import { AnimatedCounter } from "@/components/common/animated-counter";
import type { Statistic } from "@/types/conference";

interface StatisticCardProps {
  statistic: Statistic;
}

export function StatisticCard({ statistic }: StatisticCardProps) {
  const match = statistic.value.match(/^(\d+)(.*)$/);
  
  return (
    <GlassCard className="p-5">
      <p className="font-heading text-3xl font-bold text-foreground">
        {match ? (
          <>
            <AnimatedCounter value={parseInt(match[1], 10)} />
            {match[2]}
          </>
        ) : (
          statistic.value
        )}
      </p>
      <p className="mt-2 text-sm text-muted">{statistic.label}</p>
    </GlassCard>
  );
}

