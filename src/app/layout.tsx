
'use client';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { LayoutProvider } from '@/components/layout/layout-provider';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { PortfolioItem } from '@/features/portfolio/data/portfolio-data';
import { usePathname } from 'next/navigation';
import CdnClapprPlayer from '@/components/CdnClapprPlayer';
import Script from 'next/script';


interface HomePageSettings {
    websiteBackgroundVideoId?: string;
    homePageBackgroundVideoId?: string;
    isHomePageVideoEnabled?: boolean;
    isWebsiteVideoEnabled?: boolean;
}

function SiteBackground() {
    const firestore = useFirestore();
    const pathname = usePathname();
    const isHomePage = pathname === '/';
    
    const settingsDocRef = useMemoFirebase(
      () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
      [firestore]
    );
    const { data: homeSettings } = useDoc<HomePageSettings>(settingsDocRef);
    
    const homeVideoRef = useMemoFirebase(
        () => (firestore && homeSettings?.homePageBackgroundVideoId ? doc(firestore, 'projects', homeSettings.homePageBackgroundVideoId) : null),
        [firestore, homeSettings?.homePageBackgroundVideoId]
    );
    const { data: homeVideo } = useDoc<PortfolioItem>(homeVideoRef);

    const siteVideoRef = useMemoFirebase(
        () => (firestore && homeSettings?.websiteBackgroundVideoId ? doc(firestore, 'projects', homeSettings.websiteBackgroundVideoId) : null),
        [firestore, homeSettings?.websiteBackgroundVideoId]
    );
    const { data: siteVideo } = useDoc<PortfolioItem>(siteVideoRef);

    const isVideoEnabled = isHomePage
      ? homeSettings?.isHomePageVideoEnabled ?? true
      : homeSettings?.isWebsiteVideoEnabled ?? true;

    const videoSource = isHomePage 
      ? (homeVideo?.sourceUrl || "https://res.cloudinary.com/da1srnoer/video/upload/f_auto:video,q_auto/v1/wbmz1rkepnqeotpcx9tp")
      : (siteVideo?.sourceUrl || "https://res.cloudinary.com/da1srnoer/video/upload/f_auto:video,q_auto/v1/wbmz1rkepnqeotpcx9tp");
      
    const posterSource = isHomePage
      ? homeVideo?.videoPosterUrl || homeVideo?.thumbnailUrl
      : siteVideo?.videoPosterUrl || siteVideo?.thumbnailUrl;

    return (
        <div className="absolute inset-0 -z-10 w-full h-full">
            <div className="w-full h-full bg-black">
                {isVideoEnabled && videoSource && (
                   <CdnClapprPlayer
                        source={videoSource}
                        poster={posterSource}
                        chromeless={true}
                    />
                )}
            </div>
            <div className={cn("absolute inset-0", isHomePage ? "bg-black/60" : "bg-black/70")}></div>
        </div>
    );
}


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
        <link href="https://fonts.googleapis.com/css2?family=Bungee&family=Quicksand:wght@400;500;700&family=Dancing+Script:wght@700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@clappr/player@0.11.0/dist/clappr.min.css" />
        <title>Liquid Folio</title>
      </head>
      <body className={cn('font-body antialiased text-center')} suppressHydrationWarning>
        <Script src="https://cdn.jsdelivr.net/npm/@clappr/player@0.11.0/dist/clappr.min.js" strategy="beforeInteractive" />
        <FirebaseClientProvider>
            <SiteBackground />
            <LayoutProvider>
                {children}
            </LayoutProvider>
            <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}

    