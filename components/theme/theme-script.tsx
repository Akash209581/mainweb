import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/constants/theme";

export function ThemeScript() {
  const script = `
    (function() {
      try {
        var key = "${THEME_STORAGE_KEY}";
        var fallback = "${DEFAULT_THEME}";
        var theme = localStorage.getItem(key) || fallback;
        var allowed = ["tech-ai", "health-bio", "corporate"];
        if (allowed.indexOf(theme) === -1) theme = fallback;
        document.documentElement.dataset.theme = theme;
        document.documentElement.classList.add("dark");
      } catch (error) {
        document.documentElement.dataset.theme = "${DEFAULT_THEME}";
        document.documentElement.classList.add("dark");
      }
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
