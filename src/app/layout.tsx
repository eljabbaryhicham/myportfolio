
import './globals.css';
import { cn } from '@/lib/utils';
import React from 'react';
import type { Metadata, Viewport } from 'next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';
import { bungee, quicksand, dancingScript } from './fonts';
import AppShell from '@/components/layout/app-shell';
import { getHomePageSettings } from '@/lib/home-page-settings';
import { getStructuredDataJsonLd } from '@/lib/structured-data';

// Single export: generateMetadata runs at request time, shares the cache()-
// wrapped Firestore read with RootLayout via getHomePageSettings(), and
// injects the admin-configured favicon/logo into the SSR <head>. The static
// /favicon.ico is the fallback only if all three URLs are missing.
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getHomePageSettings();
  const url = settings?.faviconUrl || settings?.menubarLogoUrl || settings?.homePageLogoUrl;
  const icons: NonNullable<Metadata['icons']> = url
    ? { icon: url, shortcut: url, apple: url }
    : { icon: '/favicon.ico', shortcut: '/favicon.ico' };
  return {
    metadataBase: new URL('https://mellivision.com'),
    title: { default: 'MelliVision — Driven By Detail', template: '%s | MelliVision' },
    description: 'MelliVision — Driven By Detail. Premium motion design, VFX and creative production for brands worldwide. Explore our work.',
    keywords: [
      'motion design',
      'VFX',
      'visual effects',
      'creative production',
      'animation',
      'video production',
      'MelliVision',
    ],
    authors: [{ name: 'Hicham El Jabbary', url: 'https://mellivision.com' }],
    creator: 'MelliVision',
    publisher: 'MelliVision',
    applicationName: 'MelliVision',
    openGraph: {
      title: 'MelliVision — Driven By Detail',
      description: 'Premium motion design, VFX and creative production for brands worldwide.',
      url: 'https://mellivision.com',
      siteName: 'MelliVision',
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'MelliVision — Driven By Detail' }],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'MelliVision — Driven By Detail',
      description: 'Premium motion design, VFX and creative production.',
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'MelliVision — Driven By Detail' }],
    },
    alternates: {
      canonical: '/',
      languages: {
        en: '/',
        fr: '/',
        'x-default': '/',
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
    },
    icons,
    formatDetection: { email: false, address: false, telephone: false },
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
      : {}),
  };
}

export const viewport: Viewport = {
  themeColor: '#000000',
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
  const jsonLd = await getStructuredDataJsonLd();
  return (
    <html lang="en" className={cn("dark h-full", bungee.variable, quicksand.variable, dancingScript.variable)} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link rel="preconnect" href="https://studio-8316917408-a299a.firebaseapp.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://static.cloudflareinsights.com" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
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
