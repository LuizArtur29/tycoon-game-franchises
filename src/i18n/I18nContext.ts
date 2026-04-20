import { createContext } from 'react';
import type { Locale } from './translations';

type Params = Record<string, string | number>;

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: string, params?: Params, fallback?: string) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

