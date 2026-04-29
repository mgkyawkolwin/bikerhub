import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

type ColorScheme = 'light' | 'dark';

type ThemeContextValue = {
  colorScheme: ColorScheme;
  isDark: boolean;
  toggleTheme: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeContextProvider({ children }: { children: ReactNode }) {
  const system = useSystemColorScheme();
  const [override, setOverride] = useState<ColorScheme | null>(null);

  const colorScheme: ColorScheme = override ?? system ?? 'light';
  const isDark = colorScheme === 'dark';

  const toggleTheme = useCallback(() => {
    setOverride((prev) => {
      const current = prev ?? system ?? 'light';
      return current === 'dark' ? 'light' : 'dark';
    });
  }, [system]);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setOverride(scheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ colorScheme, isDark, toggleTheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeContext must be used inside ThemeContextProvider');
  return ctx;
}
