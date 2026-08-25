
'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { AppNav } from './app-nav';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const isMobile = useIsMobile();
  const homeScrollRef = useRef<HTMLDivElement>(null);

  // iOS WebKit (Chrome for iOS) viewport fix — external link launches WebKit
  // with a stale viewport height (100dvh/100vh calculated before toolbar settles).
  // Per spec: bind hero height to visualViewport.height via --app-height, update on:
  // visualViewport resize/scroll, immediately on load, and again after 300ms/800ms
  // to catch toolbar settling (iOS doesn't always fire resize). Also poll + synthetic scroll nudge.
  useEffect(() => {
    if (!isHomePage) return;
    const root = document.documentElement;
    const updateHeight = () => {
      const vv: VisualViewport | null | undefined = (window as unknown as { visualViewport?: VisualViewport }).visualViewport;
      const h = Math.round(vv?.height || window.innerHeight || root.clientHeight);
      if (h > 0) root.style.setProperty('--app-height', `${h}px`);
    };
    // once immediately on load
    updateHeight();
    const raf1 = requestAnimationFrame(updateHeight);
    // once again after short delay to catch toolbar settling
    const t300 = setTimeout(updateHeight, 300);
    const t800 = setTimeout(updateHeight, 800);
    const t900 = setTimeout(updateHeight, 900);
    // Poll for first 3s — extra safety for WebKit that fires no resize at all
    const poll = setInterval(updateHeight, 100);
    const tPollEnd = setTimeout(() => clearInterval(poll), 3000);
    const vv: VisualViewport | null | undefined = (window as unknown as { visualViewport?: VisualViewport }).visualViewport;
    const onResize = () => requestAnimationFrame(updateHeight);
    vv?.addEventListener('resize', onResize);
    vv?.addEventListener('scroll', onResize);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    window.addEventListener('pageshow', onResize);
    // Fallback/extra safety net: tiny synthetic scroll nudges iOS into settling toolbar + firing layout
    const tNudge = setTimeout(() => {
      // Only nudge if at top — don't fight intentional scroll
      if (window.scrollY === 0 && (homeScrollRef.current?.scrollTop ?? 0) === 0) {
        window.scrollTo(0, 1);
        window.scrollTo(0, 0);
        requestAnimationFrame(updateHeight);
      }
    }, 500);
    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(t300); clearTimeout(t800); clearTimeout(t900);
      clearInterval(poll); clearTimeout(tPollEnd);
      clearTimeout(tNudge);
      root.style.removeProperty('--app-height');
      vv?.removeEventListener('resize', onResize);
      vv?.removeEventListener('scroll', onResize);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      window.removeEventListener('pageshow', onResize);
    };
  }, [isHomePage]);

  // Homepage scroll correctness — guarantees we always START at scrollTop=0:
  // scroll-restoration and Safari pull-to-refresh can reload with the page
  // scrolled, so reset on mount + pageshow (+ briefly during toolbar settle),
  // without fighting intentional scrolling afterwards. Does not break Android/desktop.
  useEffect(() => {
    if (!isHomePage) return;
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const reset = () => {
      homeScrollRef.current?.scrollTo({ top: 0 });
      window.scrollTo({ top: 0 });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    reset();
    const raf1 = requestAnimationFrame(reset);
    const t1 = setTimeout(reset, 350);

    const vv: VisualViewport | null | undefined = (window as Window & typeof globalThis).visualViewport;
    let armed = true;
    const onResize = () => { if (armed) reset(); };
    const onShow = () => { armed = true; setTimeout(() => { armed = false; }, 2000); reset(); setTimeout(reset, 80); };
    vv?.addEventListener('resize', onResize);
    window.addEventListener('pageshow', onShow);
    const disarm = setTimeout(() => { armed = false; }, 2000);

    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(t1);
      clearTimeout(disarm);
      vv?.removeEventListener('resize', onResize);
      window.removeEventListener('pageshow', onShow);
    };
  }, [isHomePage]);

  if (isHomePage) {
    return (
      <AnimatePresence>
        <motion.div
          className={cn("flex flex-col w-full p-2 homepage-shell-fix", "force-gpu")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <main className="flex-1 min-h-0 w-full glass-effect rounded-lg border border-border/50 overflow-hidden">
            <div ref={homeScrollRef} className={cn("h-full w-full overflow-auto")}>
              {children}
            </div>
          </main>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        className={cn("flex h-full flex-col md:flex-row md:p-2", "force-gpu")}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <main className="flex-1 w-full min-h-0 px-2 pt-2 pb-0 md:p-2 flex flex-col">
            <div className="flex-1 w-full min-h-0 glass-effect rounded-lg border border-border/50 flex flex-col overflow-hidden">
                <div className={cn("h-full w-full overflow-auto")}>
                    {children}
                </div>
            </div>
        </main>
        <AppNav />
      </motion.div>
    </AnimatePresence>
  );
}
