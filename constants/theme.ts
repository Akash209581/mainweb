import type { ThemeDefinition, ThemeId } from "@/types/theme";

export const THEME_STORAGE_KEY = "icgit-theme";
export const DEFAULT_THEME: ThemeId = "tech-ai";

export const THEMES: ThemeDefinition[] = [
  {
    id: "tech-ai",
    name: "Tech & AI",
    description: "Dark navy with purple, blue, and cyan highlights"
  },
  {
    id: "health-bio",
    name: "Health & Bio",
    description: "Deep emerald with mint and teal highlights"
  },
  {
    id: "corporate",
    name: "Corporate",
    description: "Dark slate with royal and sky blue highlights"
  }
];

export function isThemeId(value: string | null): value is ThemeId {
  return Boolean(value && THEMES.some((theme) => theme.id === value));
}
