
'use client';

import { useState, useEffect } from 'react';
import { ConditionalLayout } from './conditional-layout';
import Preloader from '../preloader';

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000); // Adjust the duration as needed

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Preloader isVisible={loading} />
      {!loading && <ConditionalLayout>{children}</ConditionalLayout>}
    </>
  );
}
