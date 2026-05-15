'use client';

import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { LayoutProvider } from '@/components/layout/layout-provider';
import { DynamicThemeStyles, SiteBackground } from '@/components/layout/site-background';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <DynamicThemeStyles />
      <SiteBackground />
      <LayoutProvider>
        {children}
      </LayoutProvider>
      <Toaster />
    </FirebaseClientProvider>
  );
}
