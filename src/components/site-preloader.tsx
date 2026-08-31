'use client';

import { useEffect, useRef, useState } from 'react';
import { useHomePageSettings } from '@/components/settings/home-page-settings-provider';
import Preloader from '@/components/preloader';

/**
 * The configured brand preloader for the first document load. It lives at the
 * app-shell level so it is visible before the homepage (or any other initial
 * route) finishes rendering, rather than only after a page component mounts.
 */
export default function SitePreloader() {
  const { settings, isLoading } = useHomePageSettings();
  const [visible, setVisible] = useState(true);
  const [pageSettled, setPageSettled] = useState(false);
  const startedAt = useRef(Date.now());

  const type = settings?.preloaderType;
  const hasPreloader =
    (type === 'gif' || type === 'webm' || type === 'lottie') &&
    Boolean(settings?.preloaderUrl);

  useEffect(() => {
    const settle = () => setPageSettled(true);
    if (document.readyState === 'complete') {
      settle();
    } else {
      window.addEventListener('load', settle, { once: true });
    }
    // Never keep the overlay up indefinitely for a stalled third-party asset.
    const cap = window.setTimeout(settle, 2500);
    return () => {
      window.removeEventListener('load', settle);
      window.clearTimeout(cap);
    };
  }, []);

  useEffect(() => {
    if (!pageSettled || !hasPreloader) return;
    // Keep the brand animation visible long enough to be perceived, including
    // when settings arrived shortly after hydration.
    const elapsed = Date.now() - startedAt.current;
    const timer = window.setTimeout(() => setVisible(false), Math.max(0, 500 - elapsed));
    return () => window.clearTimeout(timer);
  }, [hasPreloader, pageSettled]);

  // If the settings document confirms no configured preloader, do not cover
  // the site with an empty overlay.
  useEffect(() => {
    if (pageSettled && !isLoading && !hasPreloader) setVisible(false);
  }, [hasPreloader, isLoading, pageSettled]);

  if (!visible || !hasPreloader) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black" aria-busy="true" aria-label="Loading website">
      <Preloader />
    </div>
  );
}
