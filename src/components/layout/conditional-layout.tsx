
'use client';

import { usePathname } from 'next/navigation';
import { AppNav } from './app-nav';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  if (isHomePage) {
    return (
      <div className="h-full w-full p-2 md:p-4">
        <main className="h-full w-full glass-effect rounded-lg border border-border/50">
          <div className="h-full w-full">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col md:flex-row p-2 md:p-4 pb-[calc(8vh+2%*2)] md:pb-4">
      <main className="flex-1 w-full glass-effect rounded-lg border border-border/50">
        <div className="h-full w-full">
          {children}
        </div>
      </main>
      <AppNav />
    </div>
  );
}
