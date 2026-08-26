'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import translations from '@/lib/i18n/translations';

const STORAGE_KEY = 'belofted_lang';

type Lang = 'fr' | 'en';

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    const initial = stored || 'en';
    setLangState(initial);
    document.documentElement.lang = initial;
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    document.documentElement.lang = l;
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  }, []);

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  const t = (key: string) => translations[lang]?.[key] ?? translations.en[key] ?? key;

  return (
    <div className={cn("flex items-center rounded-md border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden", className)}>
      <button
        onClick={() => setLang('en')}
        className={cn(
          "px-3 py-1.5 text-xs font-semibold tracking-wider transition-all duration-200",
          lang === 'en'
            ? "bg-destructive text-white"
            : "text-white/50 hover:text-white/80"
        )}
      >
        {t('layout.eng')}
      </button>
      <button
        onClick={() => setLang('fr')}
        className={cn(
          "px-3 py-1.5 text-xs font-semibold tracking-wider transition-all duration-200",
          lang === 'fr'
            ? "bg-destructive text-white"
            : "text-white/50 hover:text-white/80"
        )}
      >
        {t('layout.fr')}
      </button>
    </div>
  );
}
