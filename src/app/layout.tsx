
import './globals.css';
import { cn } from '@/lib/utils';
import React from 'react';
import { headers } from 'next/headers';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import { bungee, quicksand, dancingScript } from './fonts';
import AppShell from '@/components/layout/app-shell';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Nonce set by proxy.ts; declared on inline scripts so CSP (no unsafe-inline)
  // allows them. Next.js auto-applies this nonce to its own inline bootstrap.
  let nonce = '';
  try {
    const h = await headers();
    nonce = h.get('x-nonce') || '';
  } catch {
    nonce = '';
  }

  return (
    <html lang="en" className={cn("dark h-full", bungee.variable, quicksand.variable, dancingScript.variable)} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link rel="preconnect" href="https://studio-8316917408-a299a.firebaseapp.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://static.cloudflareinsights.com" />

        <title>MelliVision — Driven By Detail</title>
        <meta name="description" content="MelliVision — Driven By Detail. Premium motion design, VFX and creative production for brands worldwide. Explore our work." />
        <meta name="theme-color" content="#808080" />
        <script nonce={nonce} dangerouslySetInnerHTML={{
          __html: `(function(){try{var h=localStorage.getItem('belofted_theme_hsl');if(h){var r=document.querySelector(':root')||document.documentElement;r.style.setProperty('--primary',h);r.style.setProperty('--accent',h);r.style.setProperty('--destructive',h);r.style.setProperty('--ring',h);}var l=localStorage.getItem('belofted_lang');if(l)document.documentElement.lang=l;}catch(e){}})()`
        }} />
        <script nonce={nonce} dangerouslySetInnerHTML={{
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
        <script nonce={nonce} dangerouslySetInnerHTML={{
          __html: `(function(){try{var ua=navigator.userAgent||'';if(/Android/i.test(ua))document.documentElement.classList.add('is-android');if(/iPad|iPhone|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1))document.documentElement.classList.add('is-ios');}catch(e){}})()`
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
