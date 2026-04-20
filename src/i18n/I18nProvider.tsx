import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_LOCALE, I18N_STORAGE_KEY, translations, type Locale, type TranslationValue } from './translations';
import { I18nContext } from './I18nContext';

type Params = Record<string, string | number>;

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  const stored = window.localStorage.getItem(I18N_STORAGE_KEY);
  if (stored === 'pt-BR' || stored === 'en') return stored;

  return window.navigator.language.toLowerCase().startsWith('en') ? 'en' : DEFAULT_LOCALE;
}

function interpolate(template: string, params: Params = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, token: string) => {
    if (!(token in params)) return `{${token}}`;
    return String(params[token]);
  });
}

function resolveValue(value: TranslationValue | undefined, params?: Params): string | null {
  if (!value) return null;
  if (typeof value === 'function') return value(params ?? {});
  return interpolate(value, params);
}


export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(I18N_STORAGE_KEY, locale);
    }
  }, [locale]);

  const t = useCallback((key: string, params?: Params, fallback?: string) => {
    const localized = resolveValue(translations[locale][key], params);
    if (localized) return localized;

    const defaultLocalized = resolveValue(translations[DEFAULT_LOCALE][key], params);
    if (defaultLocalized) return defaultLocalized;

    return fallback ?? key;
  }, [locale]);

  const toggleLocale = useCallback(() => {
    setLocale(prev => (prev === 'pt-BR' ? 'en' : 'pt-BR'));
  }, []);

  const value = useMemo(() => ({ locale, setLocale, toggleLocale, t }), [locale, setLocale, toggleLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

