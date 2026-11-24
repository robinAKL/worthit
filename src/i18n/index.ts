import { useEffect, useState } from 'react';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '../lib/types';
import { DICTIONARIES } from './registry';

export { DEFAULT_LOCALE, LOCALES, type Locale } from '../lib/types';
export { DICTIONARIES } from './registry';
export type { Copy } from './en';
export const LOCALE_STORAGE_KEY = 'worthit.locale';

export function matchLocale(value?: string | null): Locale | undefined {
  if (!value) return undefined;
  const tag = value.trim().toLowerCase();
  return LOCALES.find((locale) => locale.toLowerCase() === tag)
    ?? LOCALES.find((locale) => locale.split('-')[0].toLowerCase() === tag.split('-')[0]);
}

export function resolveLocale(urlLanguage?: string | null, storedLanguage?: string | null, browserLanguage?: string): Locale {
  return matchLocale(urlLanguage) ?? matchLocale(storedLanguage) ?? matchLocale(browserLanguage) ?? DEFAULT_LOCALE;
}

function initialLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  let stored: string | null = null;
  try { stored = window.localStorage.getItem(LOCALE_STORAGE_KEY); } catch { /* Storage can be disabled. */ }
  return resolveLocale(new URL(window.location.href).searchParams.get('lang'), stored, window.navigator.language);
}

export function useLocale() {
  const [locale, setLocale] = useState(initialLocale);
  const copy = DICTIONARIES[locale];

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = copy.meta.title;
    let description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!description) {
      description = document.createElement('meta');
      description.name = 'description';
      document.head.append(description);
    }
    description.content = copy.meta.description;
  }, [locale, copy]);

  useEffect(() => {
    const onPopState = () => setLocale(initialLocale());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  function changeLocale(next: Locale) {
    setLocale(next);
    try { window.localStorage.setItem(LOCALE_STORAGE_KEY, next); } catch { /* The in-memory choice still works. */ }
    const url = new URL(window.location.href);
    url.searchParams.set('lang', next);
    window.history.replaceState(window.history.state, '', url);
  }

  return { locale, copy, changeLocale };
}
