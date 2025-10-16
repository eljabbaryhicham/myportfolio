
'use client';

import { usePathname } from 'next/navigation';
import { AppNav } from './app-nav';
import { AnimatePresence } from 'framer-motion';

export function ConditionalNav() {
  const pathname = usePathname();
  const showNav = pathname !== '/';

  return (
    <AnimatePresence>
      {showNav && <AppNav />}
    </AnimatePresence>
  );
}
