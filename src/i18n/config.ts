import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../locales/en.json';
import ta from '../locales/ta.json';
import hi from '../locales/hi.json';
import { Storage } from '../lib/storage';

const resources = {
  en: { translation: en },
  ta: { translation: ta },
  hi: { translation: hi }
};

// Initial language detection from UserSettings or localStorage
let initialLanguage = 'en';
try {
  const settings = Storage.getSettings();
  if (settings.preferredLanguage === 'Tamil' || settings.preferredLanguage === 'ta') {
    initialLanguage = 'ta';
  } else if (settings.preferredLanguage === 'Hindi' || settings.preferredLanguage === 'hi') {
    initialLanguage = 'hi';
  } else {
    const saved = localStorage.getItem('i18nextLng');
    if (saved && (saved.startsWith('ta') || saved === 'ta')) initialLanguage = 'ta';
    else if (saved && (saved.startsWith('hi') || saved === 'hi')) initialLanguage = 'hi';
  }
} catch {
  initialLanguage = 'en';
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'en',
    supportedLngs: ['en', 'ta', 'hi'],
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

// Update <html lang="..."> attribute dynamically
if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.language || 'en';
  i18n.on('languageChanged', (lng) => {
    document.documentElement.lang = lng;
  });
}

export function setAppLanguage(lang: 'en' | 'ta' | 'hi'): void {
  i18n.changeLanguage(lang);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
  }
  try {
    const langLabel = lang === 'ta' ? 'Tamil' : lang === 'hi' ? 'Hindi' : 'English';
    const settings = Storage.getSettings();
    Storage.saveSettings({ ...settings, preferredLanguage: langLabel });
  } catch (e) {
    console.error('Failed to persist preferredLanguage to settings:', e);
  }
}

export default i18n;

