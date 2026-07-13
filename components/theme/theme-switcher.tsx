"use client";

import { Palette } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils/cn";

export function ThemeSwitcher() {
  const { theme, themes, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2 rounded-full border border-border/40 bg-surface/60 p-1 backdrop-blur-xl">
      <Palette className="ml-2 size-4 text-accent" aria-hidden="true" />
      {themes.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-label={`Use ${item.name} theme`}
          title={item.description}
          onClick={() => setTheme(item.id)}
          className={cn(
            "focus-ring h-8 rounded-full px-3 text-xs font-semibold text-muted transition hover:bg-hover/10 hover:text-foreground",
            theme === item.id && "bg-primary text-white shadow-soft"
          )}
        >
          {item.name}
        </button>
      ))}
    </div>
  );
}
