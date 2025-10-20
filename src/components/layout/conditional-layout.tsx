
'use client';

import { usePathname } from 'next/navigation';
import { AppNav } from './app-nav';
import { AnimatePresence, motion } from 'framer-motion';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  if (isHomePage) {
    return (
      <AnimatePresence>
        <motion.div
          className="h-full w-full p-2 md:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <main className="h-full w-full glass-effect rounded-lg border border-border/50 overflow-hidden">
            <div className="h-full w-full overflow-auto">
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
        className="flex h-full flex-col md:flex-row p-2 md:p-4 pb-[calc(8vh+2%*2)] md:pb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <main className="flex-1 w-full h-[80%] md:h-full glass-effect rounded-lg border border-border/50 flex flex-col overflow-hidden">
          <div className="h-full w-full overflow-auto">
            {children}
          </div>
        </main>
        <AppNav />
      </motion.div>
    </AnimatePresence>
  );
}
