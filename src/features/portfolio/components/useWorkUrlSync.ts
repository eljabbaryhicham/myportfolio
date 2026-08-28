'use client';

import { useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Reads the shareable `?id=<slug>` project param and provides a shallow URL
 * updater. Extracted from src/app/work/page.tsx (§3.8).
 *
 * `updateUrl` deliberately uses history.replaceState instead of router.push —
 * a push triggered a full App Router route transition per click that blanked
 * the details dialog on slow/mobile connections. replaceState keeps the URL
 * shareable without a navigation.
 */
export function useWorkUrlSync() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedSlug = searchParams?.get('id');

  const updateUrl = useCallback((slug: string | null) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (slug) {
      params.set('id', slug);
    } else {
      params.delete('id');
    }
    const qs = params.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    window.history.replaceState(window.history.state, '', url);
  }, [pathname, searchParams]);

  return { selectedSlug, updateUrl };
}
