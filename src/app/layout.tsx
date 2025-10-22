
'use client';

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { LayoutProvider } from '@/components/layout/layout-provider';
import { usePathname } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { PortfolioItem } from '@/features/portfolio/data/portfolio-data';
import SmoothVideo from '@/components/video-player';


interface HomePageSettings {
    featuredProjectId: string;
}

function HomeBackgroundVideo() {
    const pathname = usePathname();
    const isHomePage = pathname === '/';
    const firestore = useFirestore();

    const settingsDocRef = useMemoFirebase(
      () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
      [firestore]
    );
    const { data: homeSettings, isLoading: isLoadingSettings } = useDoc<HomePageSettings>(settingsDocRef);
    
    const featuredProjectRef = useMemoFirebase(
        () => (firestore && homeSettings?.featuredProjectId ? doc(firestore, 'projects', homeSettings.featuredProjectId) : null),
        [firestore, homeSettings]
    );
    const { data: featuredProject, isLoading: isLoadingProject } = useDoc<PortfolioItem>(featuredProjectRef);

    if (!isHomePage) {
        return null;
    }

    return (
        <div className="absolute inset-0 -z-10 w-full h-full">
            { (isLoadingSettings || isLoadingProject) ? <div className="absolute inset-0 z-20 flex items-center justify-center bg-background" /> :
             featuredProject && featuredProject.sourceUrl && (
                 <div className="w-full h-full bg-black">
                    <SmoothVideo
                        key={featuredProject.id}
                        src={featuredProject.sourceUrl}
                        autoPlay
                        loop
                        muted
                        className="w-full h-full object-cover"
                    />
                </div>
            )}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md"></div>
        </div>
    );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  
  return (
    <html lang="en" className="dark h-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Bungee&family=Quicksand:wght@400;500;700&family=Dancing+Script:wght@700&display=swap" rel="stylesheet" />
        <title>Liquid Folio</title>
      </head>
      <body className={cn('font-body antialiased text-center')} suppressHydrationWarning>
        <div className="fixed inset-0 -z-20 overflow-hidden" style={{ filter: 'url(#metaballs)' }}>
          <div className="absolute w-[60rem] h-[60rem] bg-primary/30 rounded-full blur-3xl opacity-40 top-1/4 left-1/4 blob-1"></div>
          <div className="absolute w-[50rem] h-[50rem] bg-primary/30 rounded-full blur-3xl opacity-40 bottom-1/4 right-1/4 blob-2"></div>
          <div className="absolute w-[40rem] h-[40rem] bg-primary/30 rounded-full blur-3xl opacity-40 top-1/2 left-1/2 blob-3"></div>
          <div className="absolute w-[70rem] h-[70rem] bg-primary/30 rounded-full blur-3xl opacity-30 bottom-1/2 right-1/2 blob-4"></div>
        </div>
        <svg className="absolute w-0 h-0">
          <defs>
            <filter id="metaballs">
              <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blur" />
              <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -10" result="contrast" />
              <feBlend in="SourceGraphic" in2="contrast" />
            </filter>
          </defs>
        </svg>

        <FirebaseClientProvider>
          {isHomePage && <HomeBackgroundVideo />}
          <LayoutProvider>
            {children}
          </LayoutProvider>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
