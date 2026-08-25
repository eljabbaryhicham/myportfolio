
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

  // Homepage scroll correctness. The shell height is pure CSS 100dvh
  // .homepage-shell-fix is position:fixed inset-0, which the browser lays
  // out against the LIVE viewport on every frame — it cannot go stale the
  // way 100dvh/svh (or any measured value) does when Chrome/Safari resize
  // the viewport mid-toolbar-animation after external-link opens.
  // This effect only guarantees we always START at scrollTop=0:
  // scroll-restoration and Safari pull-to-refresh can reload with the page
  // scrolled, so reset on mount + pageshow (+ briefly during toolbar
  // settle), without fighting intentional scrolling afterwards.
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
