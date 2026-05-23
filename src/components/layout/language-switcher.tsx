'use client';

import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'belofted_lang';

export function useLanguage() {
  const [lang, setLangState] = useState<'fr' | 'en'>('en');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as 'fr' | 'en' | null;
    const initial = stored || 'en';
    setLangState(initial);
    document.documentElement.lang = initial;
  }, []);

  const setLang = useCallback((l: 'fr' | 'en') => {
    setLangState(l);
    document.documentElement.lang = l;
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  }, []);

  return { lang, setLang };
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage();

  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
      className={cn(
        "text-xs font-semibold tracking-wider text-white/60 hover:text-white transition-colors",
        className
      )}
      title="Toggle language"
    >
      {lang === 'en' ? 'FR' : 'ENG'}
    </button>
  );
}
