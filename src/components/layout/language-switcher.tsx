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
  const isEn = lang === 'en';

  return (
    <button
      type="button"
      onClick={() => setLang(other)}
      aria-label={t('layout.toggleLang')}
      title={t('layout.toggleLang')}
      className={cn(
        "relative flex items-center h-6 w-12 rounded-full border border-white/10 bg-white/10 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] select-none",
        className
      )}
    >
      {/* Circular knob that slides and shows the active language inside it */}
      <motion.span
        className="absolute top-0.5 left-0.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-destructive shadow-[0_0_12px_hsl(var(--primary)/0.6)]"
        animate={{ x: isEn ? 0 : 18 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        <span className="text-[9px] font-bold leading-none text-white">
          {isEn ? 'EN' : 'FR'}
        </span>
      </motion.span>
    </button>
  );
}
