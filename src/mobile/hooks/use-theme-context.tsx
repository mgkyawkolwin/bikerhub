// contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors as RawColors } from '@/constants/theme';

type ColorScheme = 'light' | 'dark';
type ThemeColors = typeof RawColors.light | typeof RawColors.dark;

type ThemeContextValue = {
  colorScheme: ColorScheme;
  isDark: boolean;
  colors: ThemeColors;  // 👈 Direct colors object!
  toggleTheme: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
  resetToSystemTheme: () => void;
  themeSource: 'user' | 'system';
  isLoading: boolean;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const THEME_STORAGE_KEY = '@app_theme_preference';
const THEME_SOURCE_KEY = '@app_theme_source';

export function ThemeContextProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [colorScheme, setColorScheme] = useState<ColorScheme>('light');
  const [themeSource, setThemeSource] = useState<'user' | 'system'>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved preferences on startup
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [savedTheme, savedSource] = await Promise.all([
          AsyncStorage.getItem(THEME_STORAGE_KEY),
          AsyncStorage.getItem(THEME_SOURCE_KEY),
        ]);

        if (savedSource === 'user' && (savedTheme === 'light' || savedTheme === 'dark')) {
          setColorScheme(savedTheme);
          setThemeSource('user');
        } else {
          setColorScheme(systemColorScheme ?? 'light');
          setThemeSource('system');
        }
      } catch (error) {
        console.error('Failed to load theme preferences:', error);
        setColorScheme(systemColorScheme ?? 'light');
        setThemeSource('system');
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  // Listen for system theme changes ONLY when following system
  useEffect(() => {
    if (themeSource === 'system' && systemColorScheme) {
      setColorScheme(systemColorScheme);
    }
  }, [systemColorScheme, themeSource]);

  const setUserTheme = useCallback(async (newScheme: ColorScheme) => {
    try {
      setColorScheme(newScheme);
      setThemeSource('user');
      await Promise.all([
        AsyncStorage.setItem(THEME_STORAGE_KEY, newScheme),
        AsyncStorage.setItem(THEME_SOURCE_KEY, 'user'),
      ]);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  }, []);

  const resetToSystemTheme = useCallback(async () => {
    try {
      const systemScheme = systemColorScheme ?? 'light';
      setColorScheme(systemScheme);
      setThemeSource('system');
      await Promise.all([
        AsyncStorage.removeItem(THEME_STORAGE_KEY),
        AsyncStorage.setItem(THEME_SOURCE_KEY, 'system'),
      ]);
    } catch (error) {
      console.error('Failed to reset theme:', error);
    }
  }, [systemColorScheme]);

  const toggleTheme = useCallback(() => {
    const newScheme = colorScheme === 'dark' ? 'light' : 'dark';
    setUserTheme(newScheme);
  }, [colorScheme, setUserTheme]);

  const setColorSchemeAndSave = useCallback((scheme: ColorScheme) => {
    setUserTheme(scheme);
  }, [setUserTheme]);

  // 👈 Get the current theme colors
  const colors = RawColors[colorScheme];
  const isDark = colorScheme === 'dark';

  const value = {
    colorScheme,
    isDark,
    colors,  // 👈 Expose colors directly
    toggleTheme,
    setColorScheme: setColorSchemeAndSave,
    resetToSystemTheme,
    themeSource,
    isLoading,
  };

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeContext must be used inside ThemeContextProvider');
  }
  return ctx;
}