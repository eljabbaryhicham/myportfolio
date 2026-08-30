'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/layout/language-switcher';
import { useHomeReady } from '@/components/layout/home-ready-context';
import translations from '@/lib/i18n/translations';

const SHOW_DURATION_MS = 2000;
const INITIAL_SHOW_MS = 2000;

export function LanguageToggleToast({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  const { ready } = useHomeReady();
  const [visible, setVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (collapseTimer.current) {
      clearTimeout(collapseTimer.current);
      collapseTimer.current = null;
    }
  }, []);

  // Show the full toast and schedule a collapse to the red dot. The very first
  // show (initial load) collapses after 1s; subsequent shows (e.g. toggling the
  // language) stay for 2s.
  const show = useCallback(
    (initial = false) => {
      setVisible(true);
      setCollapsed(false);
      clearTimer();
      collapseTimer.current = setTimeout(
        () => setCollapsed(true),
        initial ? INITIAL_SHOW_MS : SHOW_DURATION_MS
      );
    },
    [clearTimer]
  );

  useEffect(() => {
    if (ready) show(true);
  }, [ready, show]);

  const other: 'fr' | 'en' = lang === 'en' ? 'fr' : 'en';
  const pillIsEn = other === 'en';
  const langIsEn = lang === 'en';
  const tTarget = (key: string) => translations[other]?.[key] ?? translations.en[key] ?? key;

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          data-cursor-hide="true"
          initial={{ x: '-50%', y: 80, opacity: 0 }}
          animate={{ x: '-50%', y: 0, opacity: 1 }}
          exit={{ x: '-50%', y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          aria-live="polite"
          onClick={() => {
            // When collapsed (the red dot), tapping should expand the toast
            // rather than toggle the language (no hover on mobile).
            if (collapsed) {
              show();
            } else {
              setLang(other);
              show();
            }
          }}
          onMouseEnter={
            collapsed
              ? () => {
                  clearTimer();
                  setCollapsed(false);
                }
              : undefined
          }
          onMouseLeave={
            collapsed
              ? undefined
              : () => {
                  clearTimer();
                  setCollapsed(true);
                }
          }
          className={cn(
            "absolute bottom-4 left-1/2 z-[100] flex items-center overflow-hidden rounded-full border border-white/10 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur select-none hover:bg-white/15 transition-[width,height] duration-300",
            collapsed
              ? "h-10 w-10 justify-center p-0"
              : "h-9 w-auto gap-2 px-3 py-1.5",
            className
          )}
        >
          {collapsed ? (
            // Collapsed state: the red EN/FR knob alone.
            <motion.span
              key="collapsed"
              initial={{ scale: 0.6, opacity: 1 }}
              animate={{ scale: 1, opacity: 0.25 }}
              whileHover={{ opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{
                scale: { type: 'spring', stiffness: 500, damping: 30 },
                opacity: { duration: 0.5 },
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive shadow-[0_0_12px_hsl(var(--primary)/0.6)]"
            >
              <span className="text-[12px] font-bold leading-none text-white">
                {langIsEn ? 'EN' : 'FR'}
              </span>
            </motion.span>
          ) : (
            <>
              <motion.span
                key="label"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="whitespace-nowrap text-xs font-medium text-foreground overflow-hidden"
              >
                {tTarget('layout.toggleLangToast')}
              </motion.span>
              {/* Mini pill switch cloned from the nav LanguageSwitcher (shrunk) */}
              <span
                aria-hidden="true"
                className="relative flex h-6 w-12 shrink-0 items-center rounded-full border border-white/10 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] select-none"
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
            </>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default LanguageToggleToast;
