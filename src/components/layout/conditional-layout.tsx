
'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { AppNav } from './app-nav';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { AboutPrefetch } from '@/components/about-prefetch';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const isMobile = useIsMobile();
  const homeScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isHomePage) return;
    const root = document.documentElement;
    const vv: VisualViewport | null | undefined = (window as unknown as { visualViewport?: VisualViewport }).visualViewport;

    const updateHeight = () => {
      const vpH = vv?.height || window.innerHeight || root.clientHeight;
      if (vpH <= 0) return;
      const h = Math.round(vpH);
      if (h > 0) root.style.setProperty('--app-height', `${h}px`);
    };
    updateHeight();
    const t300 = setTimeout(updateHeight, 300);
    const t800 = setTimeout(updateHeight, 800);
    const t1500 = setTimeout(updateHeight, 1500);
    const t2500 = setTimeout(updateHeight, 2500);
    const poll = setInterval(updateHeight, 100);
    const tPollEnd = setTimeout(() => { clearInterval(poll); }, 3000);
    const onResize = () => {
      requestAnimationFrame(updateHeight);
    };
    vv?.addEventListener('resize', onResize);
    vv?.addEventListener('scroll', onResize);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize);
    window.addEventListener('orientationchange', onResize);
    window.addEventListener('pageshow', onResize);
    const tNudge = setTimeout(() => {
      if (window.scrollY === 0 && (homeScrollRef.current?.scrollTop ?? 0) === 0) {
        window.scrollTo(0, 1);
        requestAnimationFrame(() => {
          window.scrollTo(0, 0);
          requestAnimationFrame(updateHeight);
        });
      }
    }, 500);
    return () => {
      clearTimeout(t300); clearTimeout(t800); clearTimeout(t1500); clearTimeout(t2500);
      clearInterval(poll); clearTimeout(tPollEnd); clearTimeout(tNudge);
      root.style.removeProperty('--app-height');
      vv?.removeEventListener('resize', onResize);
      vv?.removeEventListener('scroll', onResize);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize);
      window.removeEventListener('orientationchange', onResize);
      window.removeEventListener('pageshow', onResize);
    };
  }, [isHomePage]);

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

  return (
    <>
      <AboutPrefetch />
      <div className={cn("w-full force-gpu", isHomePage ? "flex flex-col p-2 homepage-shell-fix" : "flex h-full flex-col md:flex-row md:p-2")}>
      <main className={cn("flex-1 min-h-0 flex flex-col", isHomePage ? "w-full" : "w-full px-2 pt-2 pb-0 md:p-2")}>
        <div className={cn("w-full min-h-0 flex flex-col overflow-hidden", isHomePage ? "h-full glass-effect rounded-lg border border-border/50" : "flex-1 glass-effect rounded-lg border border-border/50")}>
          {isHomePage ? (
            <div ref={homeScrollRef} className="h-full w-full overflow-auto">
              {children}
            </div>
          ) : (
            <div className="h-full w-full overflow-auto">
              {children}
            </div>
          )}
        </div>
      </main>
      {!isHomePage && <AppNav />}
    </div>
    </>
  );
}
