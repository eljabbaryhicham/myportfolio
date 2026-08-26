'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
    <button
      type="button"
      onClick={() => setLang(other)}
      aria-label={t('layout.toggleLang')}
      title={t('layout.toggleLang')}
      className={cn(
        "relative flex items-center h-7 min-w-[3.5rem] rounded-full border border-white/10 bg-white/10 px-1 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-colors duration-300",
        className
      )}
    >
      {/* Labels for both, knob slides over the active one */}
      <span className={cn(
        "relative z-10 flex-1 text-center text-[10px] font-semibold leading-none tracking-wider transition-colors duration-300",
        lang === 'en' ? 'text-white' : 'text-white/40'
      )}>EN</span>
      <span className={cn(
        "relative z-10 flex-1 text-center text-[10px] font-semibold leading-none tracking-wider transition-colors duration-300",
        lang === 'fr' ? 'text-white' : 'text-white/40'
      )}>FR</span>
      {/* Sliding knob — moves to the active side, like an on/off switch */}
      <motion.span
        className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-destructive shadow-[0_0_12px_hsl(var(--primary)/0.6)]"
        animate={{ left: lang === 'en' ? '4px' : '50%' }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
      />
    </button>
  );
}
