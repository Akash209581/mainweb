"use client";

import { useEffect, useState } from "react";
import { DEFAULT_THEME, isThemeId, THEME_STORAGE_KEY, THEMES } from "@/constants/theme";
import type { ThemeId } from "@/types/theme";

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeId(storedTheme)) {
      setThemeState(storedTheme);
      document.documentElement.dataset.theme = storedTheme;
    }
  }, []);

  const setTheme = (nextTheme: ThemeId) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    setThemeState(nextTheme);
  };

  return { theme, themes: THEMES, setTheme };
}
