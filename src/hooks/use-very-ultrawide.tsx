
'use client';

import { useState, useEffect } from 'react';

const VERY_ULTRAWide_ASPECT_RATIO = 1.8;

export function useVeryUltrawide() {
  const [isVeryUltrawide, setIsVeryUltrawide] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const checkAspectRatio = () => {
      const aspectRatio = window.innerWidth / window.innerHeight;
      setIsVeryUltrawide(aspectRatio > VERY_ULTRAWide_ASPECT_RATIO);
    };

    checkAspectRatio();
    window.addEventListener('resize', checkAspectRatio);

    return () => {
      window.removeEventListener('resize', checkAspectRatio);
    };
  }, []);

  return isVeryUltrawide;
}
