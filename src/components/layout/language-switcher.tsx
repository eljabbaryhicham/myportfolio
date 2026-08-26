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
  const other: Lang = lang === 'en' ? 'fr' : 'en';

  return (
    <div className={cn(
      "group relative flex items-center overflow-hidden rounded-full border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300",
      className
    )}>
      {/* Active language (calls out to the right) */}
      <button
        onClick={() => setLang(other)}
        className={cn(
          "px-2 py-1 text-[10px] font-semibold tracking-wider transition-all duration-300 whitespace-nowrap",
          lang === 'en'
            ? "bg-destructive text-white rounded-full"
            : "text-white/60 hover:text-white rounded-full"
        )}
        title={t('layout.toggleLang')}
      >
        {lang === 'en' ? 'EN' : 'FR'}
      </button>
      {/* Inactive language (slides in on hover) */}
      <button
        onClick={() => setLang(other)}
        className="px-2 py-1 text-[10px] font-semibold tracking-wider text-white/80 hover:text-white transition-all duration-300 opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-10 group-hover:px-2 overflow-hidden whitespace-nowrap"
        title={t('layout.toggleLang')}
      >
        {other === 'en' ? 'EN' : 'FR'}
      </button>
    </div>
  );
}
