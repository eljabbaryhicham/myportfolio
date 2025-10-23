
'use client';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { LayoutProvider } from '@/components/layout/layout-provider';
import ClapperPlayer from '@/components/ClapperPlayer';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { PortfolioItem } from '@/features/portfolio/data/portfolio-data';
import { usePathname } from 'next/navigation';


interface HomePageSettings {
    websiteBackgroundVideoId?: string;
    homePageBackgroundVideoId?: string;
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

    const videoSrc = isHomePage 
      ? (homeVideo?.sourceUrl || "https://res.cloudinary.com/da1srnoer/video/upload/f_auto,q_auto/v1761159959/wbmz1rkepnqeotpcx9tp.webm")
      : (siteVideo?.sourceUrl || "https://res.cloudinary.com/da1srnoer/video/upload/f_auto,q_auto/v1761159959/wbmz1rkepnqeotpcx9tp.webm");

    return (
        <div className="absolute inset-0 -z-10 w-full h-full">
            <div className="w-full h-full bg-black">
                <ClapperPlayer
                    source={videoSrc}
                    chromeless
                />
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
