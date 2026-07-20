'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Lang = 'en' | 'zh';

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (en: string | null, zh: string | null) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (en) => en || '',
});

export function useLanguage() {
  return useContext(LanguageContext);
}

/** Detect best language from browser */
function detectLanguage(): Lang {
  if (typeof window === 'undefined') return 'en';
  const nav = navigator.language || (navigator as any).userLanguage || '';
  // zh-CN, zh-TW, zh-HK, zh → Chinese
  if (nav.toLowerCase().startsWith('zh')) return 'zh';
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  // Load from localStorage or detect from browser
  useEffect(() => {
    const stored = localStorage.getItem('lang') as Lang | null;
    if (stored === 'en' || stored === 'zh') {
      setLangState(stored);
    } else {
      setLangState(detectLanguage());
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('lang', l);
  };

  /** Return Chinese if lang=zh and zh is available, otherwise English */
  const t = (en: string | null, zh: string | null): string => {
    if (lang === 'zh' && zh) return zh;
    return en || zh || '';
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
