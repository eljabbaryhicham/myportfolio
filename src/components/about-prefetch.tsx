'use client';

import { useEffect } from 'react';
import { collection, query, orderBy, doc, getDocs, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

/**
 * Warms Firestore cache for About page on first website load.
 * After initial paint (idle), it fetches `about/content` doc and `clients` collection
 * via getDocs/getDoc — these populate Firestore SDK's memory cache. When user
 * navigates to /about, useCollection/useDoc hooks hit cache instantly then
 * revalidate via onSnapshot, making navigation feel instant.
 * Uses requestIdleCallback (fallback setTimeout 2s) to not compete with critical
 * first paint. One-time fetch, not a persistent listener, so minimal cost (3 reads).
 */
export function AboutPrefetch() {
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;

    const run = async () => {
      try {
        const clientsQ = query(collection(firestore, 'clients'), orderBy('order'));
        const aboutRef = doc(firestore, 'about', 'content');
        // Run in parallel, ignore errors (e.g., offline)
        await Promise.allSettled([getDocs(clientsQ), getDoc(aboutRef)]);
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
