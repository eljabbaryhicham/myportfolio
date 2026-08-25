
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

  // M0 تشخيص حي — يُزال بعد M1 (انظر PROJECT_MAP). يقيس في كل 100ms لأول 2s:
  // vv.height | innerHeight | shell rect | scrollTop | TrustedBy
  useEffect(() => {
    if (!isHomePage) return;
    const isDiag = typeof window !== 'undefined' && (window.location.search.includes('diag=1') || localStorage.getItem('diag') === '1');
    if (!isDiag) return;
    const shell = document.querySelector<HTMLElement>('.homepage-shell-fix');
    const trustedEl = () => document.querySelector<HTMLElement>('[data-trustedby]');
    let n = 0;
    const id = setInterval(() => {
      const vv: VisualViewport | null | undefined = (window as unknown as { visualViewport?: VisualViewport }).visualViewport;
      const r = shell?.getBoundingClientRect();
      // eslint-disable-next-line no-console
      console.log(`[DIAG ${n++}] vv=${Math.round(vv?.height ?? -1)} win=${window.innerHeight} docH=${document.documentElement.clientHeight} shell=${r ? `${Math.round(r.height)}@${Math.round(r.top)}` : 'null'} scroll=${Math.round(homeScrollRef.current?.scrollTop ?? -1)}/${window.scrollY} trusted=${trustedEl()?.getBoundingClientRect().height ?? -1}`);
      if (n > 20) clearInterval(id);
    }, 100);
    const onR = () => {
      const vv: VisualViewport | null | undefined = (window as unknown as { visualViewport?: VisualViewport }).visualViewport;
      const r = shell?.getBoundingClientRect();
      // eslint-disable-next-line no-console
      console.log(`[DIAG resize] vv=${Math.round(vv?.height ?? -1)} win=${window.innerHeight} docH=${document.documentElement.clientHeight} shell=${r ? Math.round(r.height) : 'null'}`);
    };
    const vv2: VisualViewport | null | undefined = (window as unknown as { visualViewport?: VisualViewport }).visualViewport;
    vv2?.addEventListener('resize', onR);
    vv2?.addEventListener('scroll', onR);
    window.addEventListener('resize', onR);
    return () => { clearInterval(id); vv2?.removeEventListener('resize', onR); vv2?.removeEventListener('scroll', onR); window.removeEventListener('resize', onR); };
  }, [isHomePage]);

  // iOS WebKit (Chrome for iOS) viewport fix — external link launches WebKit
  // with a stale viewport height (100dvh/100vh calculated before toolbar settles).
  // We set --app-height from the LIVE visualViewport.height (WebKit) and keep
  // it in sync on every visualViewport.resize/scroll + window.resize + orientation
  // + pageshow, so the shell always matches the settled visual viewport.
  // Uses rAF + timeouts for early toolbar animation (first 900ms).
  useEffect(() => {
    if (!isHomePage) return;
    const root = document.documentElement;
    const applyHeight = () => {
      const vv: VisualViewport | null | undefined = (window as unknown as { visualViewport?: VisualViewport }).visualViewport;
      const h = Math.round(vv?.height || window.innerHeight || root.clientHeight);
      if (h > 0) root.style.setProperty('--app-height', `${h}px`);
    };
    applyHeight();
    const raf1 = requestAnimationFrame(applyHeight);
    const t1 = setTimeout(applyHeight, 100);
    const t2 = setTimeout(applyHeight, 350);
    const t3 = setTimeout(applyHeight, 900);
    const vv: VisualViewport | null | undefined = (window as unknown as { visualViewport?: VisualViewport }).visualViewport;
    const onResize = () => requestAnimationFrame(applyHeight);
    vv?.addEventListener('resize', onResize);
    vv?.addEventListener('scroll', onResize);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    window.addEventListener('pageshow', onResize);
    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      // keep --app-height on unmount? No, remove to allow fallback on other pages
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
