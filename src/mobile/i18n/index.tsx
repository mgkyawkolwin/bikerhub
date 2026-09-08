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
  availableLocales: Locale[];
  getLocaleDisplayName: (code: Locale) => string;
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

  const availableLocales = Object.keys(translations) as Locale[];

  const getLocaleDisplayName = (code: Locale) => {
    try {
      // prefer native name if Intl.DisplayNames is available
      // ask for display name in the target locale so it shows native name when supported
      // e.g. new Intl.DisplayNames(['my'], { type: 'language' }).of('my') => 'မြန်မာ'
      // fall back to known keys in translation file (e.g., Title.english)
      // or finally the code itself
      if ((Intl as any)?.DisplayNames) {
        const dn = new (Intl as any).DisplayNames([code], { type: 'language' });
        const name = dn.of(code);
        if (name) return name;
      }
    } catch {
      // ignore
    }

    // try to pick a language name from the translation resources
    const candidateTitles = translations[code]?.Title as any;
    if (candidateTitles) {
      // look for a property whose value matches the code name (common keys: english, myanmar)
      if (candidateTitles.english && code === 'en') return candidateTitles.english;
      if (candidateTitles.myanmar && code === 'my') return candidateTitles.myanmar;
      // pick the first value in Title as a fallback
      const firstKey = Object.keys(candidateTitles)[0];
      if (firstKey) return candidateTitles[firstKey];
    }

    return code;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, fmt, availableLocales, getLocaleDisplayName }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
