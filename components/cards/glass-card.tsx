import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-panel rounded-lg p-6 transition duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-glass",
        className
      )}
    >
      {children}
    </div>
  );
}
