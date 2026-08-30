'use client';

import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { LayoutProvider } from '@/components/layout/layout-provider';
import { DynamicThemeStyles, SiteBackground, DynamicFavicon } from '@/components/layout/site-background';
import { LanguageProvider } from '@/components/layout/language-switcher';
import { UploadProgressProvider } from '@/components/upload-progress-context';
import UploadProgressNotification from '@/components/upload-progress-notification';
import { HomePageSettingsProvider } from '@/components/settings/home-page-settings-provider';
import { TrustedByProvider } from '@/components/trusted-by/trusted-by-provider';
import type { HomePageSettings, TrustedByClient } from '@/lib/types';

export default function AppShell({
  children,
  initialSettings,
  initialClients,
}: {
  children: React.ReactNode;
  initialSettings: HomePageSettings | null;
  initialClients: TrustedByClient[] | null;
}) {
  return (
    <FirebaseClientProvider>
      <HomePageSettingsProvider initialSettings={initialSettings}>
        <TrustedByProvider initialClients={initialClients}>
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
        </TrustedByProvider>
      </HomePageSettingsProvider>
      <Toaster />
    </FirebaseClientProvider>
  );
}
