'use client';

import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { LayoutProvider } from '@/components/layout/layout-provider';
import { DynamicThemeStyles, SiteBackground, DynamicFavicon } from '@/components/layout/site-background';
import DynamicFontStyles from '@/components/layout/dynamic-font-styles';
import { LanguageProvider } from '@/components/layout/language-switcher';
import { HomePageSettingsProvider } from '@/components/settings/home-page-settings-provider';
import { ContactInfoProvider } from '@/components/settings/contact-info-provider';
import { TrustedByProvider } from '@/components/trusted-by/trusted-by-provider';
import SitePreloader from '@/components/site-preloader';
import type { ContactInfo, HomePageSettings, TrustedByClient } from '@/lib/types';

export default function AppShell({
  children,
  initialSettings,
  initialClients,
  initialContact,
}: {
  children: React.ReactNode;
  initialSettings: HomePageSettings | null;
  initialClients: TrustedByClient[] | null;
  initialContact: (ContactInfo & { id: string }) | null;
}) {
  return (
    <FirebaseClientProvider>
      <HomePageSettingsProvider initialSettings={initialSettings}>
        <TrustedByProvider initialClients={initialClients}>
          <ContactInfoProvider initialContact={initialContact}>
            <SitePreloader />
            <LanguageProvider>
              <DynamicThemeStyles />
              <DynamicFavicon />
              <DynamicFontStyles />
              <SiteBackground />
              <LayoutProvider>
                {children}
              </LayoutProvider>
            </LanguageProvider>
          </ContactInfoProvider>
        </TrustedByProvider>
      </HomePageSettingsProvider>
      <Toaster />
    </FirebaseClientProvider>
  );
}
