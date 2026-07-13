import { UserRoundCheck } from "lucide-react";
import { GlassCard } from "@/components/cards/glass-card";
import type { CommitteeMember } from "@/types/conference";

interface CommitteeCardProps {
  member: CommitteeMember;
}

export function CommitteeCard({ member }: CommitteeCardProps) {
  return (
    <GlassCard className="h-full">
      <UserRoundCheck className="mb-5 size-8 text-accent" aria-hidden="true" />
      <h3 className="font-heading text-lg font-semibold text-foreground">{member.name}</h3>
      <p className="mt-2 text-sm font-medium text-accent">{member.role}</p>
      <p className="mt-3 text-sm leading-7 text-muted">{member.affiliation}</p>
    </GlassCard>
  );
}
