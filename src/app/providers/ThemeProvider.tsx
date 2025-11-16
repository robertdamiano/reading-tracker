"use client";

import {createContext, useContext, useEffect, useState} from "react";

type Theme = "light" | "dark" | "system" | "christmas";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark" | "christmas";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({children}: {children: React.ReactNode}) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark" | "christmas">("light");

  // Initialize theme from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored && ["light", "dark", "system", "christmas"].includes(stored)) {
      setThemeState(stored);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = (themeClass: "light" | "dark" | "christmas") => {
      root.classList.remove("light", "dark", "christmas");
      root.classList.add(themeClass);
      setResolvedTheme(themeClass);
    };

    if (theme === "christmas") {
      applyTheme("christmas");
    } else if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const isDark = mediaQuery.matches;
      applyTheme(isDark ? "dark" : "light");

      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches ? "dark" : "light");
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    } else {
      applyTheme(theme === "dark" ? "dark" : "light");
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem("theme", newTheme);
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{theme, setTheme, resolvedTheme}}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
