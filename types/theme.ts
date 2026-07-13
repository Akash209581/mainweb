export type ThemeId = "tech-ai" | "health-bio" | "corporate";

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
}
