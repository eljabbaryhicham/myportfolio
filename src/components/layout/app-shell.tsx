'use client';

import { useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { LayoutProvider } from '@/components/layout/layout-provider';
import { DynamicThemeStyles, SiteBackground } from '@/components/layout/site-background';
import Preloader from '@/components/preloader';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { LanguageProvider } from '@/components/layout/language-switcher';

function LoadingGate({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();
  const [dismissed, setDismissed] = useState(false);

  const settingsRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
    [firestore]
  );
  const { data: settingsData, isLoading: loadingSettings } = useDoc(settingsRef);

  const contactRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'contact', 'details') : null),
    [firestore]
  );
  const { isLoading: loadingContact } = useDoc(contactRef);

  const isReady = !loadingSettings && !loadingContact;

  useEffect(() => {
    if (isReady) {
      const t = setTimeout(() => {
        document.body.style.background = '';
        setDismissed(true);
      }, 800);
      return () => clearTimeout(t);
    }
  }, [isReady]);

  if (dismissed) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
      {settingsData && (
        <Preloader settings={{
          preloaderType: settingsData.preloaderType,
          preloaderUrl: settingsData.preloaderUrl,
        }} />
      )}
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <LoadingGate>
        <LanguageProvider>
          <DynamicThemeStyles />
          <SiteBackground />
          <LayoutProvider>
            {children}
          </LayoutProvider>
        </LanguageProvider>
      </LoadingGate>
      <Toaster />
    </FirebaseClientProvider>
  );
}
