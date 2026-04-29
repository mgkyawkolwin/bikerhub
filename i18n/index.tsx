import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import en from './en';
import my from './my';

export type Locale = 'en' | 'my';
type Strings = typeof en & { Text: Record<string, string> };

const translations: Record<Locale, Strings> = { en, my };

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Strings;
  fmt: (template: string, ...args: string[]) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');
  const t = translations[locale];

  const fmt = useCallback(
    (template: string, ...args: string[]) =>
      args.reduce((s, arg, i) => s.replace(`{${i}}`, arg), template),
    [],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, fmt }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
