
'use client';

import { usePathname } from 'next/navigation';
import { AppNav } from './app-nav';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  if (isHomePage) {
    return (
      <AnimatePresence>
        <motion.div
          className="h-full w-full p-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <main className="h-full w-full glass-effect rounded-lg border border-border/50 overflow-hidden">
            <div className={cn("h-full w-full overflow-auto")}>
              {children}
            </div>
          </main>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        className="flex h-full flex-col md:flex-row md:gap-2 md:p-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <main className="flex-1 w-full min-h-0 md:p-2 flex flex-col">
            <div className="flex-1 w-full min-h-0 glass-effect rounded-lg border border-border/50 flex flex-col overflow-hidden">
                <div className={cn("h-full w-full overflow-auto")}>
                    {children}
                </div>
            </div>
        </main>
        <AppNav />
      </motion.div>
    </AnimatePresence>
  );
}
