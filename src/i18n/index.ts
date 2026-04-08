import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './ar.json';
import en from './en.json';

export const initI18n = (language: 'ar' | 'en' = 'ar') => {
  if (i18n.isInitialized) return;
  i18n.use(initReactI18next).init({
    resources: { ar: { translation: ar }, en: { translation: en } },
    lng: language,
    fallbackLng: 'ar',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  });
};

export default i18n;
