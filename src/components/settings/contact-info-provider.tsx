'use client';

import { createContext, useContext } from 'react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { ContactInfo } from '@/lib/types';

interface ContactInfoContextValue {
  /** The resolved contact info, or null while still loading on the client. */
  contactInfo: (ContactInfo & { id: string }) | null;
  /** True until the first client snapshot resolves. */
  isLoading: boolean;
  /** Non-null when the client read failed (e.g. quota/permissions). */
  error: Error | null;
}

const ContactInfoContext = createContext<ContactInfoContextValue | null>(null);

export { ContactInfoContext };

/**
 * Provides the public `contact/details` document to the React tree.
 *
 * Previously AppNav, ContactPage and ContactForm each opened their own live
 * `useDoc` subscription to this doc, creating 2-3 redundant Firestore
 * listeners on a single page. The provider now performs a single read, shared
 * by all consumers.
 *
 * The server seed prevents a loading flash on first paint. A client Firestore
 * subscription then keeps the value current when an admin saves a change.
 */
export function ContactInfoProvider({
  initialContact,
  children,
}: {
  initialContact: (ContactInfo & { id: string }) | null;
  children: React.ReactNode;
}) {
  const firestore = useFirestore();
  const contactDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'contact', 'details') : null),
    [firestore]
  );
  const { data, isLoading, error } = useDoc<ContactInfo>(contactDocRef);

  // Prefer the live snapshot when it resolves; otherwise keep the SSR seed so
  // the first paint is never empty.
  const contactInfo = data ?? initialContact ?? null;
  // Treat the page as "loaded" if we have either the live snapshot OR the
  // server-seeded value, so no loading flash occurs after hydration.
  const effectivelyLoading = isLoading && !contactInfo;

  return (
    <ContactInfoContext.Provider value={{ contactInfo, isLoading: effectivelyLoading, error }}>
      {children}
    </ContactInfoContext.Provider>
  );
}

export function useContactInfo(): ContactInfoContextValue {
  const ctx = useContext(ContactInfoContext);
  if (!ctx) {
    throw new Error('useContactInfo must be used within a ContactInfoProvider');
  }
  return ctx;
}
