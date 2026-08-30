'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/layout/language-switcher';
import { useHomeReady } from '@/components/layout/home-ready-context';
import translations from '@/lib/i18n/translations';

const SHOW_DURATION_MS = 5000;

export function LanguageToggleToast({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  const { ready } = useHomeReady();
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    clearTimer();
    setVisible(false);
  }, [clearTimer]);

  const show = useCallback(() => {
    clearTimer();
    setVisible(true);
    hideTimer.current = setTimeout(hide, SHOW_DURATION_MS);
  }, [clearTimer, hide]);

  useEffect(() => {
    if (ready) show();
  }, [ready, show]);

  const other: 'fr' | 'en' = lang === 'en' ? 'fr' : 'en';
  const pillIsEn = other === 'en';
  const tTarget = (key: string) => translations[other]?.[key] ?? translations.en[key] ?? key;

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          initial={{ x: '-50%', y: 80, opacity: 0 }}
          animate={{ x: '-50%', y: 0, opacity: 1 }}
          exit={{ x: '-50%', y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          onClick={() => {
            setLang(other);
            show();
          }}
          onMouseEnter={() => clearTimer()}
          onMouseLeave={() => {
            clearTimer();
            hideTimer.current = setTimeout(hide, SHOW_DURATION_MS);
          }}
          aria-live="polite"
          className={cn(
            "absolute bottom-4 left-1/2 z-[100] flex items-center gap-2 rounded-full border border-white/10 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] px-3 py-1.5 select-none hover:bg-white/15",
            className
          )}
        >
          <span className="text-xs font-medium text-foreground">
            {tTarget('layout.toggleLangToast')}
          </span>
          {/* Mini pill switch cloned from the nav LanguageSwitcher (shrunk) */}
          <span
            aria-hidden="true"
            className="relative flex items-center h-6 w-12 rounded-full border border-white/10 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] select-none"
          >
            <motion.span
              className="absolute z-10 flex h-5 w-5 items-center justify-center rounded-full bg-destructive shadow-[0_0_12px_hsl(var(--primary)/0.6)]"
              style={{ top: '50%' }}
              animate={{ left: pillIsEn ? 2 : 24, y: '-50%' }}
              initial={false}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <span className="text-[8px] font-bold leading-none text-white">
                {pillIsEn ? 'EN' : 'FR'}
              </span>
            </motion.span>
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default LanguageToggleToast;
