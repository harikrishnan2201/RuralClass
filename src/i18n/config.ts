import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../locales/en.json';
import ta from '../locales/ta.json';
import hi from '../locales/hi.json';
import { Storage } from '../lib/storage';

const resources = {
  en: { translation: en },
  ta: { translation: ta },
  hi: { translation: hi }
};

export function getSavedAppLanguage(): 'en' | 'ta' | 'hi' {
  if (typeof window === 'undefined') return 'en';
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const paramLang = searchParams.get('lang')?.toLowerCase();
    if (paramLang === 'ta' || paramLang === 'tamil') {
      localStorage.setItem('ruralclass_language', 'ta');
      localStorage.setItem('i18nextLng', 'ta');
      return 'ta';
    }
    if (paramLang === 'hi' || paramLang === 'hindi') {
      localStorage.setItem('ruralclass_language', 'hi');
      localStorage.setItem('i18nextLng', 'hi');
      return 'hi';
    }
    if (paramLang === 'en' || paramLang === 'english') {
      localStorage.setItem('ruralclass_language', 'en');
      localStorage.setItem('i18nextLng', 'en');
      return 'en';
    }

    const direct = localStorage.getItem('ruralclass_language');
    if (direct === 'ta' || direct === 'hi' || direct === 'en') return direct;

    const i18nLng = localStorage.getItem('i18nextLng');
    if (i18nLng?.startsWith('ta')) return 'ta';
    if (i18nLng?.startsWith('hi')) return 'hi';
    if (i18nLng?.startsWith('en')) return 'en';

    const settings = Storage.getSettings();
    if (settings.preferredLanguage === 'Tamil' || settings.preferredLanguage === 'ta') return 'ta';
    if (settings.preferredLanguage === 'Hindi' || settings.preferredLanguage === 'hi') return 'hi';
    if (settings.preferredLanguage === 'English' || settings.preferredLanguage === 'en') return 'en';
  } catch {
    // ignore
  }
  return 'en';
}

const initialLanguage = getSavedAppLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'en',
    supportedLngs: ['en', 'ta', 'hi'],
    interpolation: {
      escapeValue: false
    }
  });

// Update <html lang="..."> attribute dynamically
if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLanguage;
  i18n.on('languageChanged', (lng) => {
    const normalized = lng.startsWith('ta') ? 'ta' : lng.startsWith('hi') ? 'hi' : 'en';
    document.documentElement.lang = normalized;
  });
}

export function setAppLanguage(lang: 'en' | 'ta' | 'hi'): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ruralclass_language', lang);
      localStorage.setItem('i18nextLng', lang);
    }
  } catch (e) {
    console.error('Failed to save language to localStorage:', e);
  }

  i18n.changeLanguage(lang);

  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
  }

  try {
    const langLabel = lang === 'ta' ? 'Tamil' : lang === 'hi' ? 'Hindi' : 'English';
    const settings = Storage.getSettings();
    if (settings.preferredLanguage !== langLabel) {
      Storage.saveSettings({ ...settings, preferredLanguage: langLabel });
    }
  } catch (e) {
    console.error('Failed to persist preferredLanguage to settings:', e);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ruralclass_language_changed', { detail: lang }));
  }
}

export default i18n;


