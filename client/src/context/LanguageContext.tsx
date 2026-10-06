import React, { createContext, useContext, useState } from 'react';
import { Language, TranslationDictionary, translations } from '../i18n/translations.ts';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationDictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('traderrank_lang_pref');
      if (saved === 'en' || saved === 'ja' || saved === 'zh') {
        return saved;
      }
      // Auto-detect browser language
      const navLang = navigator.language.toLowerCase();
      if (navLang.startsWith('ja')) return 'ja';
      if (navLang.startsWith('zh')) return 'zh';
    } catch (e) {
      console.error('Error reading language preference', e);
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('traderrank_lang_pref', lang);
    } catch (e) {
      console.error('Error saving language preference', e);
    }
  };

  const t = translations[language] || translations.en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
