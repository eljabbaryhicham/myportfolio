'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/layout/language-switcher';
import { useHomeReady } from '@/components/layout/home-ready-context';
import { useIsMobile } from '@/hooks/use-mobile';
import translations from '@/lib/i18n/translations';

const INITIAL_SHOW_MS = 2000;
const HOVER_LEAVE_MS = 100;
const COLLAPSE_ANIM_MS = 500;
const RED_HOLD_MS = 500;
// Safety margin added to the measured expanded width so the label never gets
// clipped by the pivot toggle even if fonts/metrics shift slightly.
const WIDTH_BUFFER = 12;

// Collapse to the red dot: keep it at full opacity during the shrink, then
// dim it to 25% once the collapse animation has finished.
const STORAGE_KEY = 'language-toast-auto-shown';

function hasAutoShown(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function markAutoShown(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function LanguageToggleToast({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  const { ready } = useHomeReady();
  const isMobile = useIsMobile();

  const [visible, setVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  // The red dot stays at full opacity while expanding/collapsing, then fades
  // to black once the collapse animation has finished.
  const [dimmed, setDimmed] = useState(false);

  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dimTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Measured natural (expanded) width so we can animate between the collapsed
  // dot (40px) and the full pill numerically (CSS can't animate an `auto`
  // width, which caused instant snaps).
  const measureRef = useRef<HTMLDivElement>(null);
  const [expandedWidth, setExpandedWidth] = useState(40);
  const toastRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (measureRef.current) setExpandedWidth(measureRef.current.offsetWidth + WIDTH_BUFFER);
  }, [lang, ready, visible]);

  const clearCollapseTimer = useCallback(() => {
    if (collapseTimer.current) {
      clearTimeout(collapseTimer.current);
      collapseTimer.current = null;
    }
  }, []);

  const clearDimTimer = useCallback(() => {
    if (dimTimer.current) {
      clearTimeout(dimTimer.current);
      dimTimer.current = null;
    }
  }, []);

  // Collapse to the red dot, hold it red, then begin its black fade.
  const doCollapse = useCallback(() => {
    clearCollapseTimer();
    clearDimTimer();
    setDimmed(false);
    setCollapsed(true);
    dimTimer.current = setTimeout(
      () => setDimmed(true),
      COLLAPSE_ANIM_MS + RED_HOLD_MS
    );
  }, [clearCollapseTimer, clearDimTimer]);

  // Expand to the full pill; hovering/clicking keeps it open (clears timers).
  const expand = useCallback(() => {
    clearCollapseTimer();
    clearDimTimer();
    setDimmed(false);
    setCollapsed(false);
    setVisible(true);
  }, [clearCollapseTimer, clearDimTimer]);

  // Schedule a collapse after `delay` ms.
  const scheduleCollapse = useCallback(
    (delay: number) => {
      clearCollapseTimer();
      collapseTimer.current = setTimeout(() => doCollapse(), delay);
    },
    [clearCollapseTimer, doCollapse]
  );

  // Auto-expand only on the first website load of the session; afterwards just
  // show the persistent collapsed dot (e.g. when navigating back to home).
  useEffect(() => {
    if (!ready) return;
    if (hasAutoShown()) {
      setVisible(true);
      setDimmed(true);
      return;
    }
    markAutoShown();
    expand();
    scheduleCollapse(INITIAL_SHOW_MS);
  }, [ready, expand, scheduleCollapse]);

  // On mobile there is no hover; once expanded via a tap, stay expanded until
  // the user taps/click outside the toast (then collapse + dim).
  useEffect(() => {
    if (!isMobile || collapsed) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = toastRef.current;
      if (el && !el.contains(e.target as Node)) doCollapse();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [isMobile, collapsed, doCollapse]);

  // Cleanup timers on unmount (e.g. navigating away from the homepage).
  useEffect(() => {
    return () => {
      clearCollapseTimer();
      clearDimTimer();
    };
  }, [clearCollapseTimer, clearDimTimer]);

  const other: 'fr' | 'en' = lang === 'en' ? 'fr' : 'en';
  const pillIsEn = other === 'en';
  const langIsEn = lang === 'en';
  const tTarget = (key: string) => translations[other]?.[key] ?? translations.en[key] ?? key;

  return (
    <AnimatePresence>
      {visible && (
        <>
        <motion.button
          ref={toastRef}
          type="button"
          data-cursor-hide="true"
          initial={{ x: '-50%', y: 80, opacity: 0 }}
          animate={{
            x: '-50%',
            y: 0,
            opacity: 1,
            width: collapsed ? 40 : expandedWidth,
            height: collapsed ? 40 : 36,
          }}
          exit={{ x: '-50%', y: 80, opacity: 0 }}
          transition={{
            x: { duration: 0.4, ease: 'easeInOut' },
            y: { duration: 0.4, ease: 'easeInOut' },
            opacity: { duration: 0.3, ease: 'easeInOut' },
            width: { duration: 0.5, ease: 'easeInOut' },
            height: { duration: 0.5, ease: 'easeInOut' },
          }}
          aria-live="polite"
          onClick={() => {
            // Collapsed dot: tapping expands it (on mobile it then stays open
            // until the user clicks outside). Expanded: toggles the language.
            if (collapsed) {
              expand();
            } else {
              setLang(other);
              expand();
            }
          }}
          onMouseEnter={() => {
            // Hovering expands the collapsed dot and cancels any pending
            // collapse, so a hovered (expanded) pill stays open.
            if (collapsed) expand();
            else clearCollapseTimer();
          }}
          onMouseLeave={collapsed ? undefined : () => scheduleCollapse(HOVER_LEAVE_MS)}
          className={cn(
            "absolute bottom-4 left-1/2 z-[100] flex items-center overflow-hidden rounded-full border border-white/10 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur select-none hover:bg-white/15",
            collapsed ? "justify-center p-0" : "gap-3 px-3 py-1.5",
            className
          )}
        >
          {collapsed ? (
            // Collapsed state: the red EN/FR knob fades to black after collapse.
            <motion.span
              key="collapsed"
              initial={{ scale: 0.6, opacity: 1 }}
              animate={{ scale: 1, opacity: dimmed ? 0.5 : 1 }}
              whileHover={{ opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{
                scale: { duration: 0.3, ease: 'easeInOut' },
                opacity: { duration: 0.3, ease: 'easeInOut' },
              }}
              className="relative flex h-9 w-9 items-center justify-center rounded-full"
            >
              <motion.span
                aria-hidden="true"
                animate={{ opacity: dimmed ? 0 : 1 }}
                transition={{ duration: 1, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full bg-destructive shadow-[0_0_12px_hsl(var(--primary)/0.6)]"
              />
              <motion.span
                aria-hidden="true"
                animate={{ opacity: dimmed ? 1 : 0 }}
                transition={{ duration: 1, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full bg-black shadow-[0_0_12px_rgba(0,0,0,0.6)]"
              />
              <span className="relative z-10 text-[12px] font-bold leading-none text-white">
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
        {/* Hidden measurement of the expanded pill width so the size can be
            animated numerically between the dot (40px) and the full pill. */}
        <div
          ref={measureRef}
          aria-hidden="true"
          style={{ visibility: 'hidden', position: 'absolute' }}
          className="pointer-events-none z-[-1] flex items-center gap-3 whitespace-nowrap px-3 py-1.5"
        >
          <span className="text-xs font-medium">{tTarget('layout.toggleLangToast')}</span>
          <span className="flex h-6 w-12 shrink-0 rounded-full border border-white/10 bg-white/10" />
        </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default LanguageToggleToast;
