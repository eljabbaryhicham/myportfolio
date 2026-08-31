'use client';

import { useEffect, useRef, useState } from 'react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { PortfolioItem } from '@/features/portfolio/data/portfolio-data';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { cleanVideoUrl } from '@/lib/video';
import { forceAutoplay } from '@/lib/video-autoplay';
import { useHomePageSettings } from '@/components/settings/home-page-settings-provider';

interface MediaAsset {
    url: string;
}

export function SiteBackground() {
    const firestore = useFirestore();
    const pathname = usePathname();
    const isHomePage = pathname === '/';
    
    // homepage/settings is read from the shared provider (server-seeded). The
    // admin saves background changes with a cheap server revalidation (same as
    // the hero logo) which refreshes this seed, so we intentionally avoid a
    // per-visitor live Firestore listener here.
    const { settings: homeSettings } = useHomePageSettings();

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

    const rawMediaUrl = directUrl || (backgroundType === 'video'
      ? backgroundProject?.sourceUrl
      : backgroundMedia?.url);

    // Clean the URL and convert to HLS for Android if it's an m3u8
    const cleanUrl = rawMediaUrl ? cleanVideoUrl(rawMediaUrl) : rawMediaUrl;
    const isHls = cleanUrl?.includes('.m3u8');
    const [hlsInstance, setHlsInstance] = useState<any>(null);

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
    }, [isVideoShown, cleanUrl]);

    // Handle HLS streaming for Android background videos
    useEffect(() => {
      // Compute isAndroid inside effect (client-only) to avoid hydration mismatch
      const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
      if (!isVideoShown || !isAndroid || !isHls || !cleanUrl) return;
      const video = bgVideoRef.current;
      if (!video) return;

      let hls: any;
      let cancelled = false;
      (async () => {
        const { default: Hls } = await import('hls.js');
        if (cancelled || !Hls.isSupported()) {
          if (!Hls.isSupported() && video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = cleanUrl;
            forceAutoplay(video);
          }
          return;
        }
        hls = new Hls({ startLevel: -1, capLevelToPlayerSize: true });
        hls.loadSource(cleanUrl);
        hls.attachMedia(video);
        setHlsInstance(hls);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!cancelled) forceAutoplay(video);
        });
      })();
      return () => { cancelled = true; if (hls) hls.destroy(); setHlsInstance(null); };
    }, [isVideoShown, isHls, cleanUrl]);

    // Clean up HLS on unmount or when video changes
    useEffect(() => {
      return () => {
        if (hlsInstance) {
          hlsInstance.destroy();
          setHlsInstance(null);
        }
      };
    }, [hlsInstance]);

    // NOTE: no backgroundMediaId requirement — the library-picker flow stores a direct URL.
    if (!homeSettings || !backgroundType || !rawMediaUrl) return null;

    return (
        <div className="absolute inset-0 -z-10 w-full h-full">
                <div className="relative w-full h-full bg-black">
                {isVideoShown ? (
                    <video
                        key={cleanUrl}
                        ref={bgVideoRef}
                        src={cleanUrl}
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                    />
                ) : backgroundType === 'image' ? (
                    <Image
                      src={rawMediaUrl}
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
    hex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);

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
    // Settings come from the shared provider (server-seeded, live-updated).
    const { settings: homeSettings } = useHomePageSettings();

    // Apply the last-saved theme HSL from localStorage on first render so the
    // color doesn't flash from the default while Firestore loads. It's only a
    // synchronous hint; the Firestore value below still wins once it resolves.
    // Read in an effect (not the useState initializer) so server and first
    // client render are identical, avoiding a hydration mismatch.
    const [storedHsl, setStoredHsl] = useState<string | null>(null);

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
      try { setStoredHsl(localStorage.getItem(STORAGE_KEY)); } catch {}
    }, []);

    useEffect(() => {
      if (primaryHsl) {
        try { localStorage.setItem(STORAGE_KEY, primaryHsl); } catch {}
      }
    }, [primaryHsl]);

    // Resolve the accent from Firestore first (once loaded), else the
    // localStorage hint, else null. While null (SSR / before hydration) we emit
    // NO accent override so the inline <head> script that already applied the
    // persisted accent to :root before first paint is not overwritten by the
    // default-red placeholder — eliminating the theme flash on load.
    const primary = primaryHsl || storedHsl || null;
    const accent = primary
      ? `--primary: ${primary};--accent: ${primary};--destructive: ${primary};--ring: ${primary};`
      : '';

    return (
      <style>{`
        :root {
            ${accent}
            --glass-bg: rgba(${glassRgb[0]}, ${glassRgb[1]}, ${glassRgb[2]}, ${glassOpacity});
        }
        .dark {
            ${accent}
            --glass-bg: rgba(${glassRgb[0]}, ${glassRgb[1]}, ${glassRgb[2]}, ${glassOpacity});
        }
      `}</style>
    );
}

// Keeps the browser tab favicon in sync with the admin-configured logo
// (menubar logo first, homepage logo as fallback).
export function DynamicFavicon() {
    const pathname = usePathname();
    const { settings: homeSettings } = useHomePageSettings();

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
