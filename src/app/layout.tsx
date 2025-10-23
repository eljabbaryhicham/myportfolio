
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

    const currentVideo = isHomePage ? homeVideo : siteVideo;
    const videoSource = currentVideo?.sourceUrl || "https://res.cloudinary.com/da1srnoer/video/upload/f_auto:video,q_auto/v1/wbmz1rkepnqeotpcx9tp";
    const posterSource = currentVideo?.useVideoFrameAsPoster ? undefined : currentVideo?.thumbnailUrl;
      
    return (
        <div className="absolute inset-0 -z-10 w-full h-full">
            <div className="w-full h-full bg-black">
                {isVideoEnabled && videoSource && (
                    <video
                        key={videoSource}
                        className="w-full h-full object-cover"
                        poster={posterSource}
                        autoPlay
                        muted
                        loop
                        playsInline
                    >
                        <source src={videoSource} type="video/mp4" />
                    </video>
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Bungee&family=Quicksand:wght@400;500;700&family=Dancing+Script:wght@700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@clappr/player@latest/dist/clappr.min.css" />
        <script src="https://cdn.jsdelivr.net/npm/clappr@latest/dist/clappr.min.js" />
        <script src="https://cdn.jsdelivr.net/npm/clappr-pip-plugin@latest/dist/clappr-pip-plugin.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/clappr-hlsjs-playback@latest/dist/hlsjs-playback.min.js"></script>
        <script src="https://cdn.jsdelivr.net/gh/clappr/dash-shaka-playback@latest/dist/dash-shaka-playback.js" />
        <title>Liquid Folio</title>
      </head>
      <body className={cn('font-body antialiased text-center')} suppressHydrationWarning>
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
