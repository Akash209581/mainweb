import { GlassCard } from "@/components/cards/glass-card";
import type { FeatureItem } from "@/types/conference";

interface FeatureCardProps {
  feature: FeatureItem;
}

export function FeatureCard({ feature }: FeatureCardProps) {
  const Icon = feature.icon;

  return (
    <GlassCard className="h-full">
      <div className="mb-5 flex size-12 items-center justify-center rounded-lg bg-primary/15 text-accent">
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <h3 className="font-heading text-xl font-semibold text-foreground">{feature.title}</h3>
      <p className="mt-3 text-sm leading-7 text-muted">{feature.description}</p>
    </GlassCard>
  );
}
