
'use client';

import { useState, useEffect } from 'react';

const WIDE_ASPECT_RATIO = 1.7;

export function useIsWideScreen() {
  const [isWideScreen, setIsWideScreen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const checkIsWide = () => {
      const aspectRatio = window.innerWidth / window.innerHeight;
      setIsWideScreen(aspectRatio > WIDE_ASPECT_RATIO);
    };

    checkIsWide();
    window.addEventListener('resize', checkIsWide);

    return () => {
      window.removeEventListener('resize', checkIsWide);
    };
  }, []);

  return isWideScreen;
}
