'use client';

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import Lottie from "lottie-react";
import { motion } from "framer-motion";
import cursorArrowData from "@/lib/cursor-arrow.json";
import tickAnimationData from "@/lib/tick-animation.json";

import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { cn } from "@/lib/utils";

import Preloader from "@/components/preloader";
import Logo from "@/components/logo";
import TrustedBy from "./TrustedBy";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Hls from "hls.js";

const HERO_VIDEO_URL = "https://res.cloudinary.com/dsq1lxrqi/video/upload/sp_auto/pg_5/v1778867307/Ovi_Motion_Design_v3kfy0.m3u8";

interface ContactInfo {
    logoUrl?: string;
}

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
      if (!targetRef.current) return;
      const rect = targetRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = cx - e.clientX;
      const dy = cy - e.clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const over = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      setIsOver(over);

      if (!over) {
        angleRef.current = Math.atan2(dy, dx) * (180 / Math.PI) - 90;
        const scale = Math.min(1.6, 1 + Math.max(0, 1 - dist / 200) * 0.6);
        el.style.transform = `translate(-50%, -50%) rotate(${angleRef.current}deg) scale(${scale})`;
      } else {
        el.style.transform = `translate(-50%, -50%)`;
      }
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;
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
        <img key={showTick ? 'tick-gif' : 'cursor-gif'} src={useGif} alt="" className="w-full h-full object-contain" />
      ) : (
        <Lottie key={showTick ? 'tick' : 'arrow'} animationData={useLottie} loop={!showTick} />
      )}
    </div>
  );
}

const contentVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.5 } },
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

  const contactDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'contact', 'details') : null),
    [firestore]
  );
  const { data: contactInfo, isLoading: isLoadingContact } = useDoc<ContactInfo>(contactDocRef);

  const settingsDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
    [firestore]
  );
  const { data: homeSettings, isLoading: isLoadingSettings } = useDoc<HomePageSettings>(settingsDocRef);
  
  const isLoading = isLoadingContact || isLoadingSettings;

  const siteLogoUrl = homeSettings?.homePageLogoUrl;
  const homeLogoUrl = siteLogoUrl;
  const isLogoVisible = homeSettings?.isHomePageLogoVisible ?? true;
  const logoScale = homeSettings?.homePageLogoScale || 1;
  const logoColor = homeSettings?.homePageLogoColor || '';

  useEffect(() => {
    const c = 'url("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7") 0 0, none';
    const html = document.documentElement;
    const body = document.body;
    html.classList.add('hide-cursor');
    html.style.setProperty('cursor', c, 'important');
    body.style.setProperty('cursor', c, 'important');

    let mx = -1, my = -1;
    const track = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    document.addEventListener('mousemove', track, true);

    let raf: number;
    const tick = () => {
      if (mx >= 0 && my >= 0) {
        const el = document.elementFromPoint(mx, my);
        if (el) (el as HTMLElement).style.setProperty('cursor', c, 'important');
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('mousemove', track, true);
      html.classList.remove('hide-cursor');
      html.style.removeProperty('cursor');
      body.style.removeProperty('cursor');
    };
  }, []);

  useEffect(() => {
    const videoUrl = homeSettings?.heroVideoUrl || HERO_VIDEO_URL;
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    if (videoUrl.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      return () => { hls.destroy(); };
    }
  }, [homeSettings?.heroVideoUrl]);

  return (
    <div className="fixed inset-0 overflow-y-auto overflow-x-hidden">
      <div className="relative z-10 min-h-full w-full flex items-center justify-center transition-opacity duration-1000">
        <CursorArrow targetRef={ctaRef} cursorLottieUrl={homeSettings?.cursorLottieUrl} tickLottieUrl={homeSettings?.tickLottieUrl} />

        <Particles />

        {isLoading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50">
            <Preloader />
          </div>
        )}

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
              <video ref={videoRef} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" key={homeSettings?.heroVideoUrl || HERO_VIDEO_URL} style={{ pointerEvents: 'none' }} />
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
            className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4 w-full"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="text-center space-y-1 max-w-lg px-4" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>
              <h2 className="text-sm sm:text-base md:text-2xl font-headline tracking-tight" style={{ color: homeSettings?.homePageTitleColor || 'rgba(255,255,255,0.9)' }}>
                {homeSettings?.homePageTitle || t('home.hero.heading')}
              </h2>
              <p className="text-[10px] sm:text-xs md:text-base text-foreground/60 leading-relaxed" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>
                {homeSettings?.homePageSubtitle || t('home.hero.subtitle')}
              </p>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Button ref={ctaRef} asChild size="lg" className="group transition-shadow duration-300" style={{ boxShadow: "0 0 20px rgba(255,255,255,0.12)" }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 0 35px rgba(255,255,255,0.25)"}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 0 20px rgba(255,255,255,0.12)"}
              >
                <Link href="/work">
                  {t('home.hero.cta')}
                  <FontAwesomeIcon icon={faArrowRight} className="ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </motion.div>
            <motion.div variants={itemVariants} className="text-foreground/40 text-[10px] md:text-xs animate-pulse" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>
              {t('home.hero.scroll')}
            </motion.div>
            <motion.div variants={itemVariants} className="w-full">
              <TrustedBy />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
