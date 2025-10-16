
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

  // On the server or on the home page, render nothing.
  if (!isClient || pathname === '/') {
    return null;
  }

  // The key is removed, so AppNav is mounted once and animates in.
  // It will no longer re-animate when navigating between non-home pages.
  return <AppNav />;
}
