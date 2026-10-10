"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type ThemeMode = "cosmic" | "light" | "sunset";

interface ThemeContextType {
  theme: ThemeMode;
  isLight: boolean;
  setTheme: (theme: ThemeMode) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("cosmic");

  useEffect(() => {
    const saved = localStorage.getItem("thoughts_theme_mode") as ThemeMode | null;
    if (saved && (saved === "cosmic" || saved === "light" || saved === "sunset")) {
      setThemeState(saved);
      applyThemeClasses(saved);
    } else {
      applyThemeClasses("cosmic");
    }
  }, []);

  const applyThemeClasses = (mode: ThemeMode) => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.classList.remove("theme-cosmic", "theme-light", "theme-sunset", "dark", "light");
      root.classList.add(`theme-${mode}`);
      if (mode === "light") {
        root.classList.add("light");
      } else {
        root.classList.add("dark");
      }
    }
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem("thoughts_theme_mode", newTheme);
    applyThemeClasses(newTheme);
  };

  const cycleTheme = () => {
    const order: ThemeMode[] = ["cosmic", "light", "sunset"];
    const nextIndex = (order.indexOf(theme) + 1) % order.length;
    setTheme(order[nextIndex]);
  };

  const isLight = theme === "light";

  return (
    <ThemeContext.Provider value={{ theme, isLight, setTheme, cycleTheme }}>
      <div className={`theme-${theme} ${isLight ? "light text-slate-900" : "dark text-slate-100"} min-h-screen relative`}>
        <div className="theme-bg-canvas" aria-hidden="true" />
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
