'use client';

import { useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { LayoutProvider } from '@/components/layout/layout-provider';
import { DynamicThemeStyles, SiteBackground } from '@/components/layout/site-background';
import Preloader from '@/components/preloader';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

function LoadingGate({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
    [firestore]
  );
  const { isLoading: loadingSettings } = useDoc(settingsRef);

  const contactRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'contact', 'details') : null),
    [firestore]
  );
  const { isLoading: loadingContact } = useDoc(contactRef);

  const isReady = !loadingSettings && !loadingContact;

  useEffect(() => {
    if (isReady) {
      document.body.style.background = '';
    }
  }, [isReady]);

  if (!isReady) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
        <Preloader />
      </div>
    );
  }

  return <>{children}</>;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <LoadingGate>
        <DynamicThemeStyles />
        <SiteBackground />
        <LayoutProvider>
          {children}
        </LayoutProvider>
      </LoadingGate>
      <Toaster />
    </FirebaseClientProvider>
  );
}
