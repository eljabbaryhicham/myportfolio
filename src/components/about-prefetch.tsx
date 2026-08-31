'use client';

import { useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

/**
 * Warms Firestore cache for About page on first website load.
 * After initial paint (idle), it fetches the `about/content` doc via getDoc to
 * populate Firestore SDK's memory cache. When the user navigates to /about, the
 * useDoc hook hits the cache instantly then revalidates via onSnapshot, making
 * navigation feel instant.
 * Uses requestIdleCallback (fallback setTimeout 2s) to not compete with critical
 * first paint. One-time fetch, not a persistent listener, so minimal cost (1 read).
 * NOTE: `clients` is deliberately not fetched here — TrustedByProvider already
 * live-subscribes the `clients` collection globally, so a redundant getDocs would
 * only duplicate that read on every page load.
 */
export function AboutPrefetch() {
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;

    const run = async () => {
      try {
        const aboutRef = doc(firestore, 'about', 'content');
        // Ignore errors (e.g., offline)
        await getDoc(aboutRef);
      } catch {}
    };

    // Defer to idle to avoid competing with homepage video, hero, etc.
    const win = window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    let idleId: number | NodeJS.Timeout;
    if (typeof win.requestIdleCallback === 'function') {
      idleId = win.requestIdleCallback(run, { timeout: 4000 });
      return () => win.cancelIdleCallback?.(idleId as number);
    } else {
      idleId = setTimeout(run, 2000);
      return () => clearTimeout(idleId as NodeJS.Timeout);
    }
  }, [firestore]);

  return null;
}
