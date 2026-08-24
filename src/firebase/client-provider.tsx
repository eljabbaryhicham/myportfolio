
'use client';

import React, { type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [firebaseServices, setFirebaseServices] = React.useState<ReturnType<typeof initializeFirebase> | null>(null);

  React.useEffect(() => {
    // Defer Firebase init until after first paint to reduce main-thread blocking
    const init = () => setFirebaseServices(initializeFirebase());
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(init);
    } else {
      setTimeout(init, 1);
    }
  }, []);

  if (!firebaseServices) {
    // Render children without Firebase context during initial paint — they will handle loading states
    return <>{children}</>;
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
      storage={firebaseServices.storage}
    >
      {children}
    </FirebaseProvider>
  );
}
