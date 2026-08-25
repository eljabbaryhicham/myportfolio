
'use client';

import './globals.css';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import React from 'react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import { bungee, quicksand, dancingScript } from './fonts';

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
    <html lang="en" className={cn("dark h-full", bungee.variable, quicksand.variable, dancingScript.variable)} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link rel="preconnect" href="https://studio-8316917408-a299a.firebaseapp.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://static.cloudflareinsights.com" />

        <title>MelliVision — Driven By Detail</title>
        <meta name="description" content="MelliVision — Driven By Detail. Premium motion design, VFX and creative production for brands worldwide. Explore our work." />
        <meta name="theme-color" content="#808080" />
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var h=localStorage.getItem('belofted_theme_hsl');if(h){var r=document.querySelector(':root')||document.documentElement;r.style.setProperty('--primary',h);r.style.setProperty('--accent',h);r.style.setProperty('--destructive',h);r.style.setProperty('--ring',h);}var l=localStorage.getItem('belofted_lang');if(l)document.documentElement.lang=l;}catch(e){}})()`
        }} />
      </head>
      <body className={cn('font-body antialiased text-center h-full')} style={{ background: '#000' }} suppressHydrationWarning>
        <AppShell>
          {children}
        </AppShell>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
