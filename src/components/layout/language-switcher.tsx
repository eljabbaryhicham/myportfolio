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

  return (
    <div
      className={cn(
        "relative flex items-center rounded-full border border-white/10 bg-white/10 p-0.5 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
        className
      )}
      role="group"
      aria-label={t('layout.toggleLang')}
    >
      {(['en', 'fr'] as const).map((opt) => {
        const isActive = lang === opt;
        const label = opt === 'en' ? 'EN' : 'FR';
        return (
          <button
            key={opt}
            onClick={() => setLang(opt)}
            aria-pressed={isActive}
            className={cn(
              "relative z-10 px-1.5 py-0.5 text-[9px] font-semibold leading-none tracking-wider transition-colors duration-300 whitespace-nowrap",
              isActive ? "text-white" : "text-white/50 hover:text-white/80"
            )}
            title={t('layout.toggleLang')}
          >
            {isActive && (
              <motion.span
                layoutId="lang-active-pill"
                className="absolute inset-0 rounded-full bg-destructive shadow-[0_0_12px_hsl(var(--primary)/0.6)]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
