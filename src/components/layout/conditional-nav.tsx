
'use client';

import { usePathname } from 'next/navigation';
import { AppNav } from './app-nav';
import { useEffect, useState } from 'react';

export function ConditionalNav() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (pathname === '/') {
    return null;
  }

  // Only render AppNav on the client to avoid hydration mismatch
  if (!isClient) {
    return null;
  }

  return <AppNav />;
}
