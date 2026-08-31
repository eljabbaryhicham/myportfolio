'use client';

import { useHomePageSettings } from '@/components/settings/home-page-settings-provider';

// Reveal signal for inline (page-content) preloaders. Pages show their inline
// preloader only while their own data is loading, so this always reports the
// page as ready — there is no minimum-visible window. `hasPreloader` is still
// returned so callers can gate on the configured brand preloader.
export function usePageReveal() {
  const { settings } = useHomePageSettings();

  const preloaderType = settings?.preloaderType;
  const preloaderUrl = settings?.preloaderUrl;
  const hasPreloader =
    (preloaderType === 'gif' || preloaderType === 'webm' || preloaderType === 'lottie') &&
    Boolean(preloaderUrl);

  return { ready: true, hasPreloader };
}
