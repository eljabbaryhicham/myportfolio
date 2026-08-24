'use client';

import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { LayoutProvider } from '@/components/layout/layout-provider';
import { DynamicThemeStyles, SiteBackground, DynamicFavicon } from '@/components/layout/site-background';
import { LanguageProvider } from '@/components/layout/language-switcher';
import { UploadProgressProvider } from '@/components/upload-progress-context';
import UploadProgressNotification from '@/components/upload-progress-notification';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <LanguageProvider>
        <UploadProgressProvider>
          <DynamicThemeStyles />
          <DynamicFavicon />
          <SiteBackground />
          <LayoutProvider>
            {children}
          </LayoutProvider>
          <UploadProgressNotification />
        </UploadProgressProvider>
      </LanguageProvider>
      <Toaster />
    </FirebaseClientProvider>
  );
}
