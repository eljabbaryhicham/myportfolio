'use client';

import { useEffect, useState } from 'react';
import { useDoc } from '@/firebase';
import type { UseDocResult } from '@/firebase';

type DocRef = Parameters<typeof useDoc>[0];

/**
 * Wraps useDoc with a localStorage mirror: on repeat visits the UI hydrates
 * instantly from the cached document while Firestore re-syncs in the
 * background. Cache is best-effort — any storage/parse failure just means
 * normal loading behaviour.
 */
export function useCachedDoc<T>(
  memoizedDocRef: DocRef,
  cacheKey: string
): UseDocResult<T> {
  const [cachedData, setCachedData] = useState<T | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(cacheKey);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  });

  const result = useDoc<T>(memoizedDocRef);

  useEffect(() => {
    if (result.data) {
      setCachedData(result.data);
      try {
        window.localStorage.setItem(cacheKey, JSON.stringify(result.data));
      } catch {
        // storage unavailable (e.g. private mode)
      }
    }
  }, [result.data, cacheKey]);

  return {
    ...result,
    data: (result.data ?? cachedData) as UseDocResult<T>['data'],
  };
}
