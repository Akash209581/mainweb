"use client";

import { Info } from "lucide-react";
import type { ElementType } from "react";

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: ElementType;
}

export function EmptyState({
  title = "No results found",
  message = "Try adjusting your search query or filters to find what you're looking for.",
  icon: Icon = Info
}: EmptyStateProps) {
  return (
    <div className="glass-panel mx-auto max-w-lg rounded-lg p-10 text-center flex flex-col items-center border border-border/30">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted/15 text-muted mb-4">
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <h3 className="font-heading text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-xs text-muted leading-5">{message}</p>
    </div>
  );
}
