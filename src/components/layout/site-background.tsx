'use client';

import { useEffect } from 'react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { PortfolioItem } from '@/features/portfolio/data/portfolio-data';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface HomePageSettings {
    homePageBackgroundType?: 'video' | 'image';
    homePageBackgroundMediaId?: string;
    websiteBackgroundType?: 'video' | 'image';
    websiteBackgroundMediaId?: string;
    isHomePageVideoEnabled?: boolean;
    isWebsiteVideoEnabled?: boolean;
    themeColor?: string;
}

interface MediaAsset {
    url: string;
}

export function SiteBackground() {
    const firestore = useFirestore();
    const pathname = usePathname();
    const isHomePage = pathname === '/';
    
    const settingsDocRef = useMemoFirebase(
      () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
      [firestore]
    );
    const { data: homeSettings } = useDoc<HomePageSettings>(settingsDocRef);

    const backgroundType = homeSettings ? (isHomePage
        ? homeSettings.homePageBackgroundType
        : homeSettings.websiteBackgroundType) : null;

    const backgroundMediaId = homeSettings ? (isHomePage 
        ? homeSettings.homePageBackgroundMediaId 
        : homeSettings.websiteBackgroundMediaId) : null;

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

    const isVideoEnabled = homeSettings ? (isHomePage
      ? homeSettings.isHomePageVideoEnabled ?? true
      : homeSettings.isWebsiteVideoEnabled ?? true) : true;

    const mediaUrl = backgroundType === 'video' 
      ? backgroundProject?.sourceUrl
      : backgroundMedia?.url;

    if (!homeSettings || !backgroundType || !backgroundMediaId || !mediaUrl) return null;

    return (
        <div className="absolute inset-0 -z-10 w-full h-full">
            <div className="w-full h-full bg-black">
                {backgroundType === 'video' && isVideoEnabled ? (
                    <video
                        key={mediaUrl}
                        className="w-full h-full object-cover"
                        style={{ transform: 'translateZ(0)' }}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                    >
                        <source src={mediaUrl} type="video/mp4" />
                    </video>
                ) : backgroundType === 'image' ? (
                    <Image
                      src={mediaUrl}
                      alt="Background"
                      fill
                      className="object-cover"
                      priority
                    />
                ) : null}
            </div>
            <div className={cn("absolute inset-0", isHomePage ? "bg-black/60" : "bg-black/70")}></div>
        </div>
    );
}

function hexToHsl(hex: string): string | null {
    if (!hex.startsWith('#') || (hex.length !== 4 && hex.length !== 7)) {
        return null;
    }

    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
        return null;
    }

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
}

const STORAGE_KEY = 'belofted_theme_hsl';

export function DynamicThemeStyles() {
    const firestore = useFirestore();
    const settingsDocRef = useMemoFirebase(
      () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
      [firestore]
    );
    const { data: homeSettings } = useDoc<HomePageSettings>(settingsDocRef);
    
    const themeColor = homeSettings?.themeColor;
    const primaryHsl = themeColor ? hexToHsl(themeColor) : null;

    useEffect(() => {
      if (primaryHsl) {
        try { localStorage.setItem(STORAGE_KEY, primaryHsl); } catch {}
      }
    }, [primaryHsl]);

    if (!primaryHsl) return null;
  
    return (
      <style>{`
        :root {
            --primary: ${primaryHsl};
            --accent: ${primaryHsl};
            --destructive: ${primaryHsl};
            --ring: ${primaryHsl};
        }
        .dark {
            --primary: ${primaryHsl};
            --accent: ${primaryHsl};
            --destructive: ${primaryHsl};
            --ring: ${primaryHsl};
        }
      `}</style>
    );
}
