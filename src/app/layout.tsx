
'use client';

import './globals.css';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import React from 'react';

if (typeof globalThis.localStorage === 'object' && typeof globalThis.localStorage.getItem !== 'function') {
  const storage: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (k: string) => storage[k] ?? null,
    setItem: (k: string, v: string) => { storage[k] = String(v); },
    removeItem: (k: string) => { delete storage[k]; },
    clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
    key: (i: number) => Object.keys(storage)[i] ?? null,
    get length() { return Object.keys(storage).length; },
  } as Storage;
}

const AppShell = dynamic(
  () => import('@/components/layout/app-shell'),
  { ssr: false }
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" className="dark h-full" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A==" crossOrigin="anonymous" referrerPolicy="no-referrer" />
        <title>Liquid Folio</title>
        <meta name="theme-color" content="#808080" />
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var h=localStorage.getItem('belofted_theme_hsl');if(h){var r=document.querySelector(':root')||document.documentElement;r.style.setProperty('--primary',h);r.style.setProperty('--accent',h);r.style.setProperty('--destructive',h);r.style.setProperty('--ring',h);}}catch(e){}})()`
        }} />
      </head>
      <body className={cn('font-body antialiased text-center')} suppressHydrationWarning>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
