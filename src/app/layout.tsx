
import './globals.css';
import { cn } from '@/lib/utils';
import React from 'react';
import type { Metadata, Viewport } from 'next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';
import { bungee, quicksand, dancingScript } from './fonts';
import AppShell from '@/components/layout/app-shell';
import { getHomePageSettings } from '@/lib/home-page-settings';

export const metadata: Metadata = {
  metadataBase: new URL('https://mellivision.com'),
  title: { default: 'MelliVision — Driven By Detail', template: '%s | MelliVision' },
  description: 'MelliVision — Driven By Detail. Premium motion design, VFX and creative production for brands worldwide. Explore our work.',
  openGraph: {
    title: 'MelliVision — Driven By Detail',
    description: 'Premium motion design, VFX and creative production for brands worldwide.',
    url: 'https://mellivision.com',
    siteName: 'MelliVision',
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'MelliVision — Driven By Detail', description: 'Premium motion design, VFX and creative production.' },
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#808080',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server-fetch the public homepage/settings once per request so the SSR
  // HTML can render the admin-configured values (theme, title, background…)
  // on first paint. The result is passed to <AppShell> which seeds a
  // client-side SettingsProvider; live admin edits still propagate via
  // useDoc after hydration.
  const initialSettings = await getHomePageSettings();
  return (
    <html lang="en" className={cn("dark h-full", bungee.variable, quicksand.variable, dancingScript.variable)} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link rel="preconnect" href="https://studio-8316917408-a299a.firebaseapp.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://static.cloudflareinsights.com" />
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var h=localStorage.getItem('belofted_theme_hsl');if(h){var r=document.querySelector(':root')||document.documentElement;r.style.setProperty('--primary',h);r.style.setProperty('--accent',h);r.style.setProperty('--destructive',h);r.style.setProperty('--ring',h);}var l=localStorage.getItem('belofted_lang');if(l)document.documentElement.lang=l;var ns=localStorage.getItem('menubar-nav-button-size');if(ns)document.documentElement.style.setProperty('--nav-button-size',ns+'px');var ls=localStorage.getItem('menubar-logo-size');if(ls)document.documentElement.style.setProperty('--menubar-logo-size',ls+'px');}catch(e){}})()`
        }} />
        <script dangerouslySetInnerHTML={{
          __html: `(function(){
            function setAppHeight(){
              try{
                var vv=window.visualViewport;
                var h=Math.round((vv?vv.height:0)||window.innerHeight||document.documentElement.clientHeight);
                if(h>0)document.documentElement.style.setProperty('--app-height',h+'px');
              }catch(e){}
            }
            setAppHeight();
            if(window.visualViewport)window.visualViewport.addEventListener('resize',setAppHeight);
            window.addEventListener('orientationchange',function(){setTimeout(setAppHeight,150)});
          })()`
        }} />
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var ua=navigator.userAgent||'';if(/Android/i.test(ua))document.documentElement.classList.add('is-android');if(/iPad|iPhone|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1))document.documentElement.classList.add('is-ios');}catch(e){}})()`
        }} />
      </head>
      <body className={cn('font-body antialiased text-center h-full')} style={{ background: '#000' }} suppressHydrationWarning>
        <AppShell initialSettings={initialSettings}>
          {children}
        </AppShell>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
