
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

  // First-load: kill scroll-restoration offsets AND iOS address-bar settle
  // offsets. The single rAF wasn't enough — TrustedBy height arrives
  // after Firestore, so re-zero scroll after layout settles too.
  // External-referrer entries (link clicked from another app) start
  // with the toolbar fully expanded; visualViewport then shrinks on
  // settle, which can leave the homepage shell at a stale height
  // until a navigation triggers a relayout — re-apply there too.
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
    const raf2 = requestAnimationFrame(() => requestAnimationFrame(reset));
    const t1 = setTimeout(reset, 350);
    const t2 = setTimeout(reset, 900);

    // External-link handoff: also reset when the viewport re-measures
    // (toolbar collapse) or the page is shown/visible after being
    // opened in background. Only for the first ~1.5s to avoid
    // interfering with intentional scrolling.
    let armed = true;
    const onResize = () => { if (armed) reset(); };
    const onShow = () => { if (armed) { reset(); setTimeout(reset, 80); } };
    const vv: VisualViewport | null | undefined = (window as Window & typeof globalThis).visualViewport;
    vv?.addEventListener('resize', onResize);
    window.addEventListener('pageshow', onShow);
    document.addEventListener('visibilitychange', onShow);
    const disarm = setTimeout(() => { armed = false; }, 1500);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(disarm);
      vv?.removeEventListener('resize', onResize);
      window.removeEventListener('pageshow', onShow);
      document.removeEventListener('visibilitychange', onShow);
    };
  }, [isHomePage]);

  if (isHomePage) {
    return (
      <AnimatePresence>
        <motion.div
          className={cn("h-full w-full p-2 homepage-shell-fix", "force-gpu")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <main className="h-full w-full glass-effect rounded-lg border border-border/50 overflow-hidden">
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
