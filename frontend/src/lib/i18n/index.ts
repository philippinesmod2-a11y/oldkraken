'use client';

import { create } from 'zustand';
import en from './translations/en.json';
import es from './translations/es.json';
import fr from './translations/fr.json';
import de from './translations/de.json';
import ar from './translations/ar.json';

export const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'es', name: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
] as const;

const translations: Record<string, any> = { en, es, fr, de, ar };

function getInitialLocale(): string {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('oldkraken-locale');
    if (saved && translations[saved]) return saved;
  }
  return 'en';
}

interface I18nState {
  locale: string;
  dir: string;
  initialized: boolean;
  setLocale: (locale: string) => void;
  initFromSettings: (defaultLang: string) => void;
  t: (key: string) => string;
}

export const useI18n = create<I18nState>((set, get) => ({
  locale: getInitialLocale(),
  dir: languages.find(l => l.code === getInitialLocale())?.dir || 'ltr',
  initialized: false,
  setLocale: (locale: string) => {
    const lang = languages.find((l) => l.code === locale);
    set({ locale, dir: lang?.dir || 'ltr' });
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      document.documentElement.dir = lang?.dir || 'ltr';
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('oldkraken-locale', locale);
    }
  },
  initFromSettings: (defaultLang: string) => {
    const { initialized } = get();
    if (initialized) return;
    set({ initialized: true });
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('oldkraken-locale');
      if (saved && translations[saved]) {
        get().setLocale(saved);
        return;
      }
    }
    if (defaultLang && translations[defaultLang]) {
      get().setLocale(defaultLang);
    }
  },
  t: (key: string) => {
    const { locale } = get();
    const keys = key.split('.');
    let value: any = translations[locale] || translations['en'];
    for (const k of keys) {
      value = value?.[k];
    }
    if (value === undefined) {
      let fallback: any = translations['en'];
      for (const k of keys) {
        fallback = fallback?.[k];
      }
      return fallback || key;
    }
    return value;
  },
}));
