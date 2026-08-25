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
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Hls from "hls.js";

const HERO_VIDEO_URL = "https://res.cloudinary.com/dsq1lxrqi/video/upload/sp_auto/pg_5/v1778867307/Ovi_Motion_Design_v3kfy0.m3u8";
const HERO_VIDEO_POSTER = "https://res.cloudinary.com/dsq1lxrqi/image/upload/so_0,f_auto,q_auto/v1778867307/Ovi_Motion_Design_v3kfy0.jpg";

interface HomePageSettings {
    homePageLogoUrl?: string;
    isHomePageLogoVisible?: boolean;
    homePageLogoScale?: number;
    homePageLogoColor?: string;
    heroVideoUrl?: string;
    cursorLottieUrl?: string;
    tickLottieUrl?: string;
    homePageTitle?: string;
    homePageSubtitle?: string;
    homePageTitleColor?: string;
}

function Particles() {
  const circles = [];
  for (let i = 0; i < 20; i++) {
    const size = Math.random() * 3 + 1;
    const duration = Math.random() * 10 + 10;
    circles.push(
      <motion.div
        key={i}
        className="absolute rounded-full bg-white/10"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: size,
          height: size,
        }}
        animate={{ y: [0, -30, 0], opacity: [0.1, 0.4, 0.1] }}
        transition={{ duration, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 10 }}
      />
    );
  }
  return <div className="absolute inset-0 pointer-events-none overflow-hidden">{circles}</div>;
}

function CursorArrow({ targetRef, cursorLottieUrl, tickLottieUrl }: { targetRef: React.RefObject<HTMLButtonElement | null>; cursorLottieUrl?: string; tickLottieUrl?: string }) {
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

      if (!targetRef.current) return;
      const rect = targetRef.current.getBoundingClientRect();
      const tx = rect.left + rect.width / 2;
      const ty = rect.top + rect.height / 2;
      const dx = tx - cx;
      const dy = ty - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const over = cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom;
      setIsOver(over);

      if (!over) {
        angleRef.current = Math.atan2(dy, dx) * (180 / Math.PI) - 90;
        const scale = Math.min(1.6, 1 + Math.max(0, 1 - dist / 200) * 0.6);
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
  }, [targetRef]);

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
      className="pointer-events-none fixed z-50 w-10 h-10"
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
  const firestore = useFirestore();
  const { t } = useTranslation();
  const ctaRef = useRef<HTMLButtonElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const settingsDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
    [firestore]
  );
  const { data: homeSettings, isLoading: isLoadingSettings } = useDoc<HomePageSettings>(settingsDocRef);
  
  const isLoading = isLoadingSettings;

  const homeLogoUrl = homeSettings?.homePageLogoUrl;
  const isLogoVisible = homeSettings?.isHomePageLogoVisible ?? true;
  const logoScale = homeSettings?.homePageLogoScale || 1;
  const logoColor = homeSettings?.homePageLogoColor || '';

  useEffect(() => {
    // Preload the default hero poster with high priority for LCP
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = HERO_VIDEO_POSTER;
    // @ts-ignore - fetchPriority is not in the type but is valid
    link.fetchPriority = 'high';
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch {} };
  }, []);

  useEffect(() => {
    const videoUrl = homeSettings?.heroVideoUrl;
    const video = videoRef.current;
    if (!video || !videoUrl || videoUrl === HERO_VIDEO_URL) return;

    if (videoUrl.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({ startLevel: -1 });
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
        return () => { hls.destroy(); };
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoUrl;
        video.play().catch(() => {});
      }
    } else {
      video.src = videoUrl;
      video.play().catch(() => {});
    }
  }, [homeSettings?.heroVideoUrl]);

  return (
    <div className="hide-cursor-homepage homepage-viewport-fix relative h-full w-full overflow-hidden">
      <div className="homepage-viewport-fix-inner relative z-10 flex h-full w-full items-center justify-center overflow-auto transition-opacity duration-1000">
        <CursorArrow targetRef={ctaRef} cursorLottieUrl={homeSettings?.cursorLottieUrl} tickLottieUrl={homeSettings?.tickLottieUrl} />

        <Particles />

        <AnimatePresence>
          {isLoading && (
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

        <div className="flex flex-col items-center gap-1 sm:gap-2 md:gap-3 w-full px-4">
          <motion.div
            className="w-[min(80vw,500px)] md:w-[min(70vw,600px)]"
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
              <video ref={videoRef} autoPlay muted loop playsInline preload="metadata" poster={HERO_VIDEO_POSTER} className="absolute inset-0 w-full h-full object-cover" style={{ pointerEvents: 'none' }} />
              <div className="absolute inset-0 bg-black/60" />
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

          <motion.div
            data-content
            className="flex flex-col items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6 w-full"
            variants={contentVariants}
            initial="hidden"
            animate={isLoading ? "hidden" : "visible"}
          >
            <motion.div variants={itemVariants} className="text-center space-y-2 max-w-lg md:max-w-xl lg:max-w-2xl px-4" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>
              <h2 className="text-base sm:text-lg md:text-3xl lg:text-4xl font-headline tracking-tight min-h-[1.5rem] md:min-h-[2.5rem]" style={{ color: homeSettings?.homePageTitleColor || 'rgba(255,255,255,0.9)' }}>
                {homeSettings?.homePageTitle || t('home.hero.heading')}
              </h2>
              <p className="text-xs sm:text-sm md:text-lg lg:text-xl text-foreground/60 leading-relaxed min-h-[2.5rem] md:min-h-[1.75rem]" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>
                {homeSettings?.homePageSubtitle || t('home.hero.subtitle')}
              </p>
            </motion.div>
            <motion.div variants={itemVariants} className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <Button asChild className="group transition-shadow duration-300 rounded-full min-h-[44px] h-11 md:h-8 px-3 sm:px-3 md:px-4 text-[11px] sm:text-[11px] md:text-sm gap-1.5" style={{ boxShadow: "0 0 15px rgba(255,255,255,0.1)" }}>
                <Link href="/about">
                  <FontAwesomeIcon icon={faCircleInfo} className="h-3 w-3 md:h-3 md:w-3" />
                  {t('nav.about')}
                </Link>
              </Button>
              <Button ref={ctaRef} asChild size="lg" className="group transition-shadow duration-300 min-h-[44px] md:h-12 md:px-8 md:text-lg" style={{ boxShadow: "0 0 20px rgba(255,255,255,0.12)" }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 0 35px rgba(255,255,255,0.25)"}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 0 20px rgba(255,255,255,0.12)"}
              >
                <Link href="/work">
                  {t('home.hero.cta')}
                  <FontAwesomeIcon icon={faArrowRight} className="ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild className="group transition-shadow duration-300 rounded-full min-h-[44px] h-11 md:h-8 px-3 sm:px-3 md:px-4 text-[11px] sm:text-[11px] md:text-sm gap-1.5" style={{ boxShadow: "0 0 15px rgba(255,255,255,0.1)" }}>
                <Link href="/contact">
                  {t('nav.contact')}
                  <FontAwesomeIcon icon={faEnvelope} className="h-3 w-3 md:h-3 md:w-3" />
                </Link>
              </Button>
            </motion.div>
            <motion.div variants={itemVariants} className="text-foreground/40 text-xs md:text-sm lg:text-base animate-pulse" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>
              {t('home.hero.scroll')}
            </motion.div>
            <motion.div variants={itemVariants} data-trustedby className="w-full min-h-[88px] md:min-h-[92px]">
              <TrustedBy />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
