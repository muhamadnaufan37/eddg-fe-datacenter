/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";
import { showToast } from "../services/toast";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      // Cek localStorage terlebih dahulu
      const savedTheme = localStorage.getItem("theme") as Theme;
      if (savedTheme) {
        return savedTheme;
      }
    } catch (e) {
      // localStorage might be blocked in incognito/private mode
      showToast(
        "warn",
        "Peringatan",
        e instanceof Error
          ? e.message
          : "localStorage tidak tersedia. Tema tidak bisa disimpan.",
      );
    }
    // Default to light theme
    return "light";
  });

  useEffect(() => {
    // Simpan theme ke localStorage
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {
      // localStorage might be blocked in incognito/private mode
      showToast(
        "warn",
        "Peringatan",
        e instanceof Error
          ? e.message
          : "Gagal menyimpan tema ke localStorage.",
      );
    }

    // Toggle class dark pada html element
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.classList.toggle("dark", theme === "dark");
      root.dataset.theme = theme;
      root.style.colorScheme = theme;
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
