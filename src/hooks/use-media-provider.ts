'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'preferred-media-provider';

export type MediaProvider = 'cloudinary' | 'vercel_blob' | 'appwrite' | 'gumlet_video' | 'gumlet_image';

function readStored(): MediaProvider {
  if (typeof window === 'undefined') return 'cloudinary';
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === 'cloudinary' || v === 'vercel_blob' || v === 'appwrite' || v === 'gumlet_video' || v === 'gumlet_image') return v;
  } catch {
    // storage unavailable
  }
  return 'cloudinary';
}

/**
 * Read/write the admin's preferred media provider in localStorage. Replaces
 * the prior `homepage/settings.provider` Firestore field — that was a UI
 * hint, not user content, and it polluted the settings doc.
 */
export function useMediaProvider() {
  const [provider, setProviderState] = useState<MediaProvider>('cloudinary');

  useEffect(() => {
    setProviderState(readStored());
  }, []);

  const setProvider = useCallback((value: MediaProvider) => {
    setProviderState(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // storage unavailable
    }
  }, []);

  return [provider, setProvider] as const;
}
