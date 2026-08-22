'use client';

import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { LayoutProvider } from '@/components/layout/layout-provider';
import { DynamicThemeStyles, SiteBackground, DynamicFavicon } from '@/components/layout/site-background';
import { LanguageProvider } from '@/components/layout/language-switcher';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <LanguageProvider>
        <DynamicThemeStyles />
        <DynamicFavicon />
        <SiteBackground />
        <LayoutProvider>
          {children}
        </LayoutProvider>
      </LanguageProvider>
      <Toaster />
    </FirebaseClientProvider>
  );
}
