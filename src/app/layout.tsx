import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { ConditionalNav } from '@/components/layout/conditional-nav';

export const metadata: Metadata = {
  title: 'Liquid Folio',
  description: 'A portfolio showcasing creative work with a liquid glass aesthetic.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased text-center')} suppressHydrationWarning>
        <FirebaseClientProvider>
          <div className="flex h-full flex-col md:flex-row p-2 md:p-4">
            <main className="flex-1 w-full glass-effect rounded-lg border border-border/50">
              {children}
            </main>
            <ConditionalNav />
          </div>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
