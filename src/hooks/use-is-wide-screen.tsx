
'use client';

import { useState, useEffect } from 'react';

const WIDE_SCREEN_BREAKPOINT = 1920;

export function useIsWideScreen() {
  const [isWideScreen, setIsWideScreen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const checkIsWide = () => {
      setIsWideScreen(window.innerWidth > WIDE_SCREEN_BREAKPOINT);
    };

    checkIsWide();
    window.addEventListener('resize', checkIsWide);

    return () => {
      window.removeEventListener('resize', checkIsWide);
    };
  }, []);

  return isWideScreen;
}
