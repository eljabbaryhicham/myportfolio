'use client';

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import Lottie from "lottie-react";
import { motion, AnimatePresence } from "framer-motion";
import cursorArrowData from "@/lib/cursor-arrow.json";
import tickAnimationData from "@/lib/tick-animation.json";

import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCircleInfo, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { cn } from "@/lib/utils";

import Preloader from "@/components/preloader";
import Logo from "@/components/logo";
import TrustedBy from "./TrustedBy";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getLocalizedString } from "@/lib/i18n/multilingual";
import { cleanVideoUrl } from "@/lib/video";
import { forceAutoplay } from "@/lib/video-autoplay";
import type { HomePageSettings } from "@/lib/types";
import { useHomePageSettings } from '@/components/settings/home-page-settings-provider';
import { useHomeReady } from '@/components/layout/home-ready-context';
const HERO_VIDEO_URL = "https://res.cloudinary.com/dsq1lxrqi/video/upload/sp_auto/pg_5/v1778867307/Ovi_Motion_Design_v3kfy0.m3u8";
const HERO_VIDEO_POSTER = "https://res.cloudinary.com/dsq1lxrqi/image/upload/so_0,f_auto,q_auto/v1778867307/Ovi_Motion_Design_v3kfy0.jpg";
// Smaller, faster-loading poster for the LCP image (720w, q_auto:good).
// The full-res poster above stays as a constant for any future use that
// needs the unblurred/high-quality version.
const HERO_VIDEO_POSTER_LCP = "https://res.cloudinary.com/dsq1lxrqi/image/upload/so_0,w_720,q_auto:good/v1778867307/Ovi_Motion_Design_v3kfy0.jpg";

function CursorArrow({ targetRefs, cursorLottieUrl, tickLottieUrl }: { targetRefs: React.RefObject<HTMLElement | null>[]; cursorLottieUrl?: string; tickLottieUrl?: string }) {
  const arrowRef = useRef<HTMLDivElement>(null);
  const angleRef = useRef(0);
  const [isOver, setIsOver] = useState(false);
  const [customCursor, setCustomCursor] = useState<any>(null);
  const [customTick, setCustomTick] = useState<any>(null);
  const [cursorGif, setCursorGif] = useState<string | null>(null);
  const [tickGif, setTickGif] = useState<string | null>(null);

  useEffect(() => {
    const el = arrowRef.current;
    if (!el) return;

    const update = (e: MouseEvent) => {
      const cx = e.clientX;
      const cy = e.clientY;

      // Find the nearest target (if any) and whether the cursor is over it.
      let nearestEl: HTMLElement | null = null;
      let nearestDist = Infinity;
      let overAny = false;
      for (const r of targetRefs) {
        const t = r.current;
        if (!t) continue;
        const rect = t.getBoundingClientRect();
        if (cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom) {
          overAny = true;
        }
        const tx = rect.left + rect.width / 2;
        const ty = rect.top + rect.height / 2;
        const dx = tx - cx;
        const dy = ty - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestEl = t;
        }
      }

      setIsOver(overAny);

      if (!nearestEl) {
        el.style.opacity = "0";
        return;
      }

      const rect = nearestEl.getBoundingClientRect();
      const tx = rect.left + rect.width / 2;
      const ty = rect.top + rect.height / 2;
      const dx = tx - cx;
      const dy = ty - cy;

      if (!overAny) {
        angleRef.current = Math.atan2(dy, dx) * (180 / Math.PI) - 90;
        const scale = Math.min(1.6, 1 + Math.max(0, 1 - nearestDist / 200) * 0.6);
        el.style.transform = `translate(-50%, -50%) rotate(${angleRef.current}deg) scale(${scale})`;
      } else {
        el.style.transform = `translate(-50%, -50%)`;
      }
      el.style.left = `${cx}px`;
      el.style.top = `${cy}px`;
      el.style.opacity = "1";
    };

    const hide = () => { if (arrowRef.current) arrowRef.current.style.opacity = "0"; };

    window.addEventListener("mousemove", update);
    window.addEventListener("mouseleave", hide);
    return () => {
      window.removeEventListener("mousemove", update);
      window.removeEventListener("mouseleave", hide);
    };
  }, [targetRefs]);

  useEffect(() => {
    if (!cursorLottieUrl) { setCustomCursor(null); setCursorGif(null); return; }
    const isGif = /\.gif$/i.test(cursorLottieUrl);
    if (isGif) {
      setCursorGif(cursorLottieUrl);
      setCustomCursor(null);
      return;
    }
    let disposed = false;
    fetch(cursorLottieUrl)
      .then(r => r.json())
      .then(data => { if (!disposed) { setCustomCursor(data); setCursorGif(null); } })
      .catch(() => {});
    return () => { disposed = true; };
  }, [cursorLottieUrl]);

  useEffect(() => {
    if (!tickLottieUrl) { setCustomTick(null); setTickGif(null); return; }
    const isGif = /\.gif$/i.test(tickLottieUrl);
    if (isGif) {
      setTickGif(tickLottieUrl);
      setCustomTick(null);
      return;
    }
    let disposed = false;
    fetch(tickLottieUrl)
      .then(r => r.json())
      .then(data => { if (!disposed) { setCustomTick(data); setTickGif(null); } })
      .catch(() => {});
    return () => { disposed = true; };
  }, [tickLottieUrl]);

  const showTick = isOver;
  const useGif = showTick ? tickGif : cursorGif;
  const useLottie = showTick ? (customTick || tickAnimationData) : (customCursor || cursorArrowData);

  return (
    <div
      ref={arrowRef}
      className="pointer-events-none fixed z-[10000] w-10 h-10"
      style={{ left: -100, top: -100, opacity: 0 }}
    >
      {useGif ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin-supplied arbitrary-host GIF; next/image would require per-domain config
        <img key={showTick ? 'tick-gif' : 'cursor-gif'} src={useGif} alt="" className="w-full h-full object-contain" />
      ) : (
        <Lottie key={showTick ? 'tick' : 'arrow'} animationData={useLottie} loop={!showTick} />
      )}
    </div>
  );
}

const contentVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function HomePageContent() {
  const { t, lang } = useTranslation();
  const ctaRef = useRef<HTMLButtonElement | null>(null);
  const aboutRef = useRef<HTMLButtonElement | null>(null);
  const contactRef = useRef<HTMLButtonElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Read from the shared SettingsProvider (seeded server-side, kept live
  // by the provider's own useDoc subscription). This avoids a re-fetch
  // and a flash of defaults on first paint.
  const { settings: homeSettings, isLoading: isLoadingSettings } = useHomePageSettings();
  // Only show the full-screen preloader on the very first load (no cached data yet);
  // on client-side navigations Firestore may briefly be isLoading while re-attaching,
  // but we already have data to render so we must not flash a black overlay.
  const [hasReceivedData, setHasReceivedData] = useState(Boolean(homeSettings));
  useEffect(() => {
    if (homeSettings) setHasReceivedData(true);
  }, [homeSettings]);
  const isLoading = isLoadingSettings && !hasReceivedData && !homeSettings;

  // Full-page preloader gate: true until the window's `load` event has fired
  // (i.e. all images, fonts, and the hero video metadata are ready) AND a
  // short minimum visible time has elapsed so the brand preloader never
  // blinks on fast connections. On client-side navigations back to home the
  // document is already fully loaded (`readyState === 'complete'`), so we
  // reveal immediately and never flash the preloader for in-app navigation.
  // Replaces the old "settings not loaded" gate that became always-false once
  // the SettingsProvider seeds SSR data.
  const [pageReady, setPageReady] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const MIN_VISIBLE_MS = 500;
    const startedAt = Date.now();
    const reveal = () => {
      const elapsed = Date.now() - startedAt;
      const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
      setTimeout(() => setPageReady(true), wait);
    };
    if (document.readyState === 'complete') {
      // Page already fully loaded (in-app navigation/mount after load): no
      // wait, no preloader flash.
      setPageReady(true);
      return;
    }
    const onLoad = () => {
      window.removeEventListener('load', onLoad);
      reveal();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);
  // Show the full-screen preloader while settings are still loading OR the
  // page hasn't fully loaded. After both, fade it out.
  const showFullPreloader = isLoading || !pageReady;

  // Signal the home is ready once the preloader has fully faded out, so
  // the language switch toast can appear right after (not on top of) the
  // preloader. Guarded so it only fires once per page lifetime.
  const { notifyReady } = useHomeReady();
  const readySignaledRef = useRef(false);
  useEffect(() => {
    if (showFullPreloader || readySignaledRef.current) return;
    readySignaledRef.current = true;
    const t = setTimeout(notifyReady, 400); // matches preloader exit duration (0.35s)
    return () => clearTimeout(t);
  }, [showFullPreloader, notifyReady]);

  const homeLogoUrl = homeSettings?.homePageLogoUrl;
  const isLogoVisible = homeSettings?.isHomePageLogoVisible ?? true;
  const logoScale = homeSettings?.homePageLogoScale || 1;
  const logoColor = homeSettings?.homePageLogoColor || '';

  useEffect(() => {
    // Preload the default hero poster with high priority for LCP. Use a
    // smaller 720w/q_auto:good variant so the LCP image paints quickly;
    // the full-res poster stays blurred behind overlays and the logo.
    const posterLink = document.createElement('link');
    posterLink.rel = 'preload';
    posterLink.as = 'image';
    posterLink.href = HERO_VIDEO_POSTER_LCP;
    // @ts-ignore - fetchPriority is not in the type but is valid
    posterLink.fetchPriority = 'high';
    document.head.appendChild(posterLink);

    // Preload the hero video source so the browser starts the request in
    // parallel with the page render instead of waiting for the <video>
    // element to mount. `as="fetch"` works for both an HLS manifest and
    // a direct MP4/WebM file (the browser will reuse the cached response
    // when the <video> requests the same URL).
    const sourceLink = document.createElement('link');
    sourceLink.rel = 'preload';
    sourceLink.as = 'fetch';
    sourceLink.href = HERO_VIDEO_URL;
    sourceLink.crossOrigin = 'anonymous';
    // @ts-ignore - fetchPriority is not in the type but is valid
    sourceLink.fetchPriority = 'high';
    document.head.appendChild(sourceLink);

    return () => {
      try { document.head.removeChild(posterLink); } catch {}
      try { document.head.removeChild(sourceLink); } catch {}
    };
  }, []);

  useEffect(() => {
    const videoUrl = homeSettings?.heroVideoUrl;
    const video = videoRef.current;
    if (!video || !videoUrl || videoUrl === HERO_VIDEO_URL) return;

    // Strip f_auto/duplicate transforms so mobile <video> gets a clean mp4
    // (f_auto content-negotiation can deliver WebM/GIF that iOS can't decode).
    const cleanUrl = cleanVideoUrl(videoUrl) || videoUrl;

    if (cleanUrl.includes('.m3u8')) {
      let hls: any;
      let cancelled = false;
      (async () => {
        // Lazy-load hls.js only when an adaptive-stream hero is configured, so
        // the ~500 KB tracker stays out of the public bundle until needed.
        const { default: Hls } = await import('hls.js');
        // Compute isAndroid inside effect (client-only) to avoid hydration mismatch
        const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
        if (cancelled || !Hls.isSupported()) {
          if (!Hls.isSupported() && video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = cleanUrl;
            forceAutoplay(video);
          }
          return;
        }
        // Android: cap level to player size (720p max) for performance
        hls = new Hls({ startLevel: -1, capLevelToPlayerSize: isAndroid });
        hls.loadSource(cleanUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!cancelled) forceAutoplay(video);
        });
      })();
      return () => { cancelled = true; if (hls) hls.destroy(); };
    } else {
      video.src = cleanUrl;
      forceAutoplay(video);
    }
  }, [homeSettings?.heroVideoUrl]);

  return (
    <div className="hide-cursor-homepage homepage-viewport-fix relative h-full w-full overflow-hidden">
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${HERO_VIDEO_POSTER})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(40px) brightness(0.4)',
          transform: 'scale(1.2)',
        }}
      />
      <div className="homepage-viewport-fix-inner relative z-10 flex h-full w-full items-center justify-center overflow-auto transition-opacity duration-1000">
        <CursorArrow targetRefs={[aboutRef, contactRef, ctaRef]} cursorLottieUrl={homeSettings?.cursorLottieUrl} tickLottieUrl={homeSettings?.tickLottieUrl} />

        <AnimatePresence>
          {showFullPreloader && (
            <motion.div
              key="home-preloader"
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <Preloader />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col items-center gap-1 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-5 w-full px-4">
          <div className="translate-y-6 lg:translate-y-10">
            <motion.div
              className="w-[min(80vw,500px)] md:w-[min(70vw,600px)] lg:w-[min(82vw,880px)] xl:w-[min(86vw,1020px)]"
              style={{ aspectRatio: "16/9", position: "relative" }}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
            <div className="absolute inset-0" style={{
              borderRadius: 24,
              overflow: "hidden",
              boxShadow: "0 0 60px rgba(0,0,0,0.4)",
              border: "0.5px solid rgba(255,255,255,0.5)",
              maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.8) 8%, black 18%, black 20%, rgba(0,0,0,0.5) 70%, transparent 95%)",
              WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.8) 8%, black 18%, black 20%, rgba(0,0,0,0.5) 70%, transparent 95%)",
            }}>
              <div style={{
                position: "absolute",
                inset: -60,
                borderRadius: "50%",
                background: "radial-gradient(ellipse at center, rgba(255,255,255,0.08) 0%, transparent 70%)",
                filter: "blur(50px)",
              }} />
              <video ref={videoRef} autoPlay muted loop playsInline preload="auto" poster={HERO_VIDEO_POSTER_LCP} className="absolute inset-0 w-full h-full object-cover" style={{ pointerEvents: 'none' }} {...({ fetchPriority: 'high' } as any)} />
              <div className="absolute inset-0 bg-background/60" />
              <div className="absolute inset-0" style={{ backdropFilter: "blur(1px)" }} />
            </div>
            {isLogoVisible && homeLogoUrl && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 10 }}>
                <div className="w-full max-w-sm px-4" style={{ transform: `scale(${logoScale})` }}>
                  <Logo src={homeLogoUrl} color={logoColor || undefined} />
                </div>
              </div>
            )}
          </motion.div>
          </div>

          <motion.div
            data-content
            className="-mt-6 lg:-mt-10 flex flex-col items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8 w-full"
            variants={contentVariants}
            initial="hidden"
            animate={isLoading ? "hidden" : "visible"}
          >
            <motion.div variants={itemVariants} className="text-center space-y-2 max-w-lg md:max-w-xl lg:max-w-3xl px-4" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>
              {isLoading ? (
                <div className="min-h-[1.5rem] md:min-h-[2.5rem] flex items-center justify-center">
                  <div className="h-4 md:h-6 w-56 sm:w-72 animate-pulse rounded bg-white/10" />
                </div>
              ) : (
                <h2 className="text-base sm:text-lg md:text-3xl xl:text-4xl font-headline tracking-tight min-h-[1.5rem] md:min-h-[2.5rem]" style={{ color: homeSettings?.homePageTitleColor || 'rgba(255,255,255,0.9)' }}>
                  {getLocalizedString(homeSettings?.homePageTitle, lang) || t('home.hero.heading')}
                </h2>
              )}
              {isLoading ? (
                <div className="min-h-[2.5rem] md:min-h-[1.75rem] flex items-center justify-center">
                  <div className="h-3 md:h-4 w-72 sm:w-96 animate-pulse rounded bg-white/10" />
                </div>
              ) : (
                <p className="text-xs sm:text-sm md:text-lg lg:text-xl text-foreground/60 leading-relaxed min-h-[2.5rem] md:min-h-[1.75rem]" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>
                  {getLocalizedString(homeSettings?.homePageSubtitle, lang) || t('home.hero.subtitle')}
                </p>
              )}
            </motion.div>
            <motion.div variants={itemVariants} className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-4">
              <Button ref={aboutRef} asChild className="group transition-shadow duration-300 rounded-full min-h-[36px] h-9 md:h-8 px-2.5 sm:px-3 md:px-4 text-[10px] sm:text-[11px] md:text-sm lg:text-base gap-2 shrink-0 bg-white/10 backdrop-blur-md border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-white/15">
                <Link href="/about">
                  <FontAwesomeIcon icon={faCircleInfo} className="h-2.5 w-2.5 md:h-3 md:w-3" />
                  {t('nav.about')}
                </Link>
              </Button>
              <Button ref={ctaRef} asChild size="lg" variant="destructive" className="group transition-shadow duration-300 min-h-[36px] md:h-12 px-3 sm:px-4 md:px-8 text-[11px] sm:text-xs md:text-lg shrink min-w-0 border-0" style={{ boxShadow: "0 0 20px hsl(var(--primary) / 0.3)" }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 0 35px hsl(var(--primary) / 0.5)"}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 0 20px hsl(var(--primary) / 0.3)"}
              >
                <Link href="/work" className="truncate">
                  {t('home.hero.cta')}
                  <FontAwesomeIcon icon={faArrowRight} className="ml-1.5 md:ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button ref={contactRef} asChild className="group transition-shadow duration-300 rounded-full min-h-[36px] h-9 md:h-8 px-2.5 sm:px-3 md:px-4 text-[10px] sm:text-[11px] md:text-sm lg:text-base gap-2 shrink-0 bg-white/10 backdrop-blur-md border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-white/15">
                <Link href="/contact">
                  {t('nav.contact')}
                  <FontAwesomeIcon icon={faEnvelope} className="h-2.5 w-2.5 md:h-3 md:w-3" />
                </Link>
              </Button>
            </motion.div>
            <motion.div variants={itemVariants} className="text-foreground/40 text-xs md:text-sm lg:text-base animate-pulse" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>
              {t('home.hero.scroll')}
            </motion.div>
            <motion.div variants={itemVariants} className="w-full min-h-[88px] md:min-h-[92px] lg:min-h-[104px]">
              <TrustedBy />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
