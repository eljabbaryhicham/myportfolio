'use client';

import { useEffect, useRef, useState } from 'react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { PortfolioItem } from '@/features/portfolio/data/portfolio-data';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { HomePageSettings } from '@/lib/types';
import { cleanVideoUrl } from '@/lib/video';
import { forceAutoplay } from '@/lib/video-autoplay';

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

    // Direct URL (new library-picker flow) wins; legacy mediaId lookups kept
    // as fallback for backgrounds set through the media library.
    const directUrl = homeSettings ? (isHomePage
        ? homeSettings.homePageBackgroundUrl
        : homeSettings.websiteBackgroundUrl) : null;

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

    const mediaUrl = directUrl || (backgroundType === 'video'
      ? backgroundProject?.sourceUrl
      : backgroundMedia?.url);

    const isVideoShown = backgroundType === 'video' && isVideoEnabled;

    const bgVideoRef = useRef<HTMLVideoElement | null>(null);

    // Drive autoplay via JS (muted+playsinline+retry) so mobile browsers start it.
    useEffect(() => {
      if (!isVideoShown) return;
      const video = bgVideoRef.current;
      if (!video) return;
      return forceAutoplay(video, {
        onPlaying: () => { video.style.opacity = '1'; },
      });
    }, [isVideoShown, mediaUrl]);

    // NOTE: no backgroundMediaId requirement — the library-picker flow stores a direct URL.
    if (!homeSettings || !backgroundType || !mediaUrl) return null;

    return (
        <div className="absolute inset-0 -z-10 w-full h-full">
                <div className="relative w-full h-full bg-black">
                {isVideoShown ? (
                    <video
                        key={mediaUrl}
                        ref={bgVideoRef}
                        src={cleanVideoUrl(mediaUrl)}
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                    />
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

export function DynamicThemeStyles() {    const firestore = useFirestore();
    const settingsDocRef = useMemoFirebase(
      () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
      [firestore]
    );
    const { data: homeSettings } = useDoc<HomePageSettings>(settingsDocRef);

    // Apply the last-saved theme HSL from localStorage on first render so the
    // color doesn't flash from the default while Firestore loads. It's only a
    // synchronous hint; the Firestore value below still wins once it resolves.
    const [storedHsl] = useState<string | null>(() => {
      if (typeof window === 'undefined') return null;
      try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
    });

    const themeColor = homeSettings?.themeColor;
    const primaryHsl = themeColor ? hexToHsl(themeColor) : null;
    const glassOpacity = (homeSettings?.glassOpacity ?? 25) / 100;
    const hexToRgb = (hex: string): [number, number, number] | null => {
      if (!hex?.startsWith('#')) return null;
      const v = hex.replace('#', '');
      const full = v.length === 3 ? v.split('').map(c => c + c).join('') : v;
      if (full.length !== 6) return null;
      const n = parseInt(full, 16);
      if (isNaN(n)) return null;
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    const glassRgb = hexToRgb(homeSettings?.glassColor || '#000000') || [0, 0, 0];

    useEffect(() => {
      if (primaryHsl) {
        try { localStorage.setItem(STORAGE_KEY, primaryHsl); } catch {}
      }
    }, [primaryHsl]);

    const primary = primaryHsl || storedHsl || '352 76% 48%';
  
    return (
      <style>{`
        :root {
            --primary: ${primary};
            --accent: ${primary};
            --destructive: ${primary};
            --ring: ${primary};
            --glass-bg: rgba(${glassRgb[0]}, ${glassRgb[1]}, ${glassRgb[2]}, ${glassOpacity});
        }
        .dark {
            --primary: ${primary};
            --accent: ${primary};
            --destructive: ${primary};
            --ring: ${primary};
            --glass-bg: rgba(${glassRgb[0]}, ${glassRgb[1]}, ${glassRgb[2]}, ${glassOpacity});
        }
      `}</style>
    );
}

// Keeps the browser tab favicon in sync with the admin-configured logo
// (menubar logo first, homepage logo as fallback).
export function DynamicFavicon() {
    const firestore = useFirestore();
    const pathname = usePathname();
    const settingsDocRef = useMemoFirebase(
      () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
      [firestore]
    );
    const { data: homeSettings } = useDoc<HomePageSettings>(settingsDocRef);

    useEffect(() => {
        const logoUrl = homeSettings?.faviconUrl || homeSettings?.menubarLogoUrl || homeSettings?.homePageLogoUrl;
        if (!logoUrl) return;
        const apply = () => {
            const links = document.querySelectorAll<HTMLLinkElement>("link[rel~='icon']");
            const setLink = (link: HTMLLinkElement) => {
                link.href = logoUrl;
                const lower = logoUrl.toLowerCase();
                if (lower.endsWith('.svg')) link.type = 'image/svg+xml';
                else if (lower.endsWith('.png')) link.type = 'image/png';
                else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) link.type = 'image/jpeg';
                else if (lower.endsWith('.ico')) link.type = 'image/x-icon';
                else link.removeAttribute('type');
            };
            if (links.length) links.forEach(setLink);
            else {
                const link = document.createElement('link');
                link.rel = 'icon';
                setLink(link);
                document.head.appendChild(link);
            }
        };
        apply();
        // Next.js may inject a fresh default icon on client navigation; patch on next tick
        const t = setTimeout(apply, 0);
        return () => clearTimeout(t);
    }, [homeSettings?.faviconUrl, homeSettings?.menubarLogoUrl, homeSettings?.homePageLogoUrl, pathname]);

    return null;
}
