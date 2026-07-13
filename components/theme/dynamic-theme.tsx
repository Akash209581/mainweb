/* eslint-disable @typescript-eslint/no-explicit-any */

interface DynamicThemeProps {
  tokens: any;
}

export function DynamicTheme({ tokens }: DynamicThemeProps) {
  if (!tokens) return null;

  const colors = {
    ...(tokens.colors || {}),
    ...tokens
  };

  const convert = (hex: string) => {
    if (!hex) return "";
    if (typeof hex !== "string") return hex;
    if (hex.startsWith("#")) {
      const cleaned = hex.replace("#", "");
      const num = parseInt(cleaned, 16);
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      return `${r} ${g} ${b}`;
    }
    return hex;
  };

  const styleRules = `
    :root {
      ${colors.background ? `--color-background: ${convert(colors.background)} !important;` : ""}
      ${colors.surface ? `--color-surface: ${convert(colors.surface)} !important;` : ""}
      ${colors.card ? `--color-card: ${convert(colors.card)} !important;` : ""}
      ${colors.border ? `--color-border: ${convert(colors.border)} !important;` : ""}
      ${colors.textPrimary ? `--color-text-primary: ${convert(colors.textPrimary)} !important;` : ""}
      ${colors.textSecondary ? `--color-text-secondary: ${convert(colors.textSecondary)} !important;` : ""}
      ${colors.primary ? `--color-primary: ${convert(colors.primary)} !important;` : ""}
      ${colors.secondary ? `--color-secondary: ${convert(colors.secondary)} !important;` : ""}
      ${colors.accent ? `--color-accent: ${convert(colors.accent)} !important;` : ""}
      ${colors.glow ? `--color-glow: ${convert(colors.glow)} !important;` : ""}
      ${colors.success ? `--color-success: ${convert(colors.success)} !important;` : ""}
      ${colors.warning ? `--color-warning: ${convert(colors.warning)} !important;` : ""}
      ${colors.danger ? `--color-danger: ${convert(colors.danger)} !important;` : ""}
      ${colors.hover ? `--color-hover: ${convert(colors.hover)} !important;` : ""}
      
      ${tokens.borderRadius ? `--border-radius: ${tokens.borderRadius} !important;` : ""}
      ${tokens.fontFamilyHeading ? `--font-outfit: ${tokens.fontFamilyHeading}, sans-serif !important;` : ""}
      ${tokens.fontFamilyBody ? `--font-inter: ${tokens.fontFamilyBody}, sans-serif !important;` : ""}
    }
  `;

  return <style dangerouslySetInnerHTML={{ __html: styleRules }} />;
}
