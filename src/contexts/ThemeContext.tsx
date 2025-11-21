import React, { createContext, useContext, useEffect, useState } from "react";

type ThemeContextType = {
  currentTheme: string;
  setTheme: (themeId: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    // Get theme from localStorage or default to theme-0
    return localStorage.getItem("carebag-theme") || "theme-0";
  });

  useEffect(() => {
    // Apply theme to document root
    document.documentElement.setAttribute("data-theme", currentTheme);
    // Save to localStorage
    localStorage.setItem("carebag-theme", currentTheme);
  }, [currentTheme]);

  const setTheme = (themeId: string) => {
    setCurrentTheme(themeId);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme }}>
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
