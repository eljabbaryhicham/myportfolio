'use client';

import { useEffect, useState } from 'react';
import { useHomePageSettings } from '@/components/settings/home-page-settings-provider';

// Runs before a page's content is revealed. Mirrors the homepage's full-screen
// preloader gate, but for inline (page-content) preloaders:
//  - Stays "not ready" until the window `load` event fires AND a short minimum
//    visible time has elapsed so the brand preloader never blinks on fast
//    connections.
//  - On client-side in-app navigation the document is already fully loaded
//    (`readyState === 'complete'`), so it reveals immediately and never flashes.
//  - Returns `hasPreloader` so callers only gate when a custom preloader
//    (gif/webm/lottie with a URL) is actually configured; otherwise reveal.
export function usePageReveal() {
  const { settings } = useHomePageSettings();

  const preloaderType = settings?.preloaderType;
  const preloaderUrl = settings?.preloaderUrl;
  const hasPreloader =
    (preloaderType === 'gif' || preloaderType === 'webm' || preloaderType === 'lottie') &&
    Boolean(preloaderUrl);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const MIN_VISIBLE_MS = 500;
    const startedAt = Date.now();
    const reveal = () => {
      const elapsed = Date.now() - startedAt;
      const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
      setTimeout(() => setReady(true), wait);
    };
    if (document.readyState === 'complete') {
      // Page already fully loaded (in-app navigation/mount after load): reveal
      // immediately, no preloader flash.
      setReady(true);
      return;
    }
    const onLoad = () => {
      window.removeEventListener('load', onLoad);
      reveal();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  // Guard: if a custom preloader is never configured (e.g. settings load late),
  // make sure we never leave the page stuck hidden.
  useEffect(() => {
    if (!hasPreloader) setReady(true);
  }, [hasPreloader]);

  return { ready, hasPreloader };
}
