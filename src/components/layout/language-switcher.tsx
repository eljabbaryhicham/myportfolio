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
        "relative flex items-center h-8 w-16 rounded-full border border-white/10 bg-white/10 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] select-none",
        className
      )}
    >
      {/* Inactive language label sits on the opposite side the knob is leaving */}
      <span
        className={cn(
          "absolute inset-y-0 flex items-center text-[10px] font-semibold leading-none tracking-wider transition-opacity duration-300",
          isEn ? "left-2 text-white/40" : "right-2 text-white/40"
        )}
      >
        {isEn ? 'FR' : 'EN'}
      </span>

      {/* Circular knob that slides and shows the active language inside it */}
      <motion.span
        className="absolute top-1 left-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-destructive shadow-[0_0_12px_hsl(var(--primary)/0.6)]"
        animate={{ x: isEn ? 0 : 30 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        <span className="text-[9px] font-bold leading-none text-white">
          {isEn ? 'EN' : 'FR'}
        </span>
      </motion.span>
    </button>
  );
}
