
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
      {loading && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background">
          <Preloader isVisible={true} />
        </div>
      )}
      {!loading && <ConditionalLayout>{children}</ConditionalLayout>}
    </>
  );
}
