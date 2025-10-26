
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
import Image from 'next/image';

interface HomePageSettings {
    homePageBackgroundType?: 'video' | 'image';
    homePageBackgroundMediaId?: string;
    websiteBackgroundType?: 'video' | 'image';
    websiteBackgroundMediaId?: string;
    isHomePageVideoEnabled?: boolean;
    isWebsiteVideoEnabled?: boolean;
}

interface MediaAsset {
    url: string;
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
    
    const backgroundType = isHomePage
        ? homeSettings?.homePageBackgroundType || 'video'
        : homeSettings?.websiteBackgroundType || 'video';

    const backgroundMediaId = isHomePage 
        ? homeSettings?.homePageBackgroundMediaId 
        : homeSettings?.websiteBackgroundMediaId;
    
    const backgroundProjectRef = useMemoFirebase(
        () => (firestore && backgroundMediaId && backgroundType === 'video' ? doc(firestore, 'projects', backgroundMediaId) : null),
        [firestore, backgroundMediaId, backgroundType]
    );
    const { data: backgroundProject } = useDoc<PortfolioItem>(backgroundProjectRef);

    const backgroundMediaRef = useMemoFirebase(
        () => (firestore && backgroundMediaId && backgroundType === 'image' ? doc(firestore, 'media', backgroundMediaId) : null),
        [firestore, backgroundMediaId, backgroundType]
    );
    const { data: backgroundMedia } = useDoc<MediaAsset>(backgroundMediaRef);

    const isVideoEnabled = isHomePage
      ? homeSettings?.isHomePageVideoEnabled ?? true
      : homeSettings?.isWebsiteVideoEnabled ?? true;

    const mediaUrl = backgroundType === 'video' 
      ? backgroundProject?.sourceUrl
      : backgroundMedia?.url;
      
    const posterUrl = backgroundType === 'video' ? backgroundProject?.thumbnailUrl : undefined;

    return (
        <div className="absolute inset-0 -z-10 w-full h-full">
            <div className="w-full h-full bg-black">
                {backgroundType === 'video' && isVideoEnabled && mediaUrl ? (
                    <video
                        key={mediaUrl}
                        className="w-full h-full object-cover"
                        poster={posterUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        controls
                    >
                        <source src={mediaUrl} type="video/mp4" />
                    </video>
                ) : backgroundType === 'image' && mediaUrl ? (
                    <Image
                      src={mediaUrl}
                      alt="Background"
                      fill
                      className="object-cover"
                      priority
                    />
                ) : (
                    // Fallback to default video
                    <video
                        key="default-video"
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                        controls
                    >
                        <source src="https://res.cloudinary.com/da1srnoer/video/upload/f_auto:video,q_auto/v1/wbmz1rkepnqeotpcx9tp" type="video/mp4" />
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
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A==" crossOrigin="anonymous" referrerPolicy="no-referrer" />
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
