
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
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface ContactInfo {
    logoUrl?: string;
}

interface HomePageSettings {
    homePageLogoUrl?: string;
    isHomePageLogoVisible?: boolean;
}

function CursorArrow({ targetRef }: { targetRef: React.RefObject<HTMLButtonElement | null> }) {
  const arrowRef = useRef<HTMLDivElement>(null);
  const angleRef = useRef(0);
  const [isOver, setIsOver] = useState(false);

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

  return (
    <motion.div
      ref={arrowRef}
      className="pointer-events-none fixed z-50 w-10 h-10"
      initial={{ opacity: 0 }}
      style={{ left: -100, top: -100 }}
    >
      {isOver ? (
        <Lottie key="tick" animationData={tickAnimationData} loop={false} />
      ) : (
        <Lottie key="arrow" animationData={cursorArrowData} loop={true} />
      )}
    </motion.div>
  );
}

export default function HomePageContent() {
  const firestore = useFirestore();
  const { t } = useTranslation();
  const ctaRef = useRef<HTMLButtonElement | null>(null);

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

  const siteLogoUrl = contactInfo?.logoUrl;
  const homeLogoUrl = homeSettings?.homePageLogoUrl || siteLogoUrl;
  const isLogoVisible = homeSettings?.isHomePageLogoVisible ?? true;

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center p-4">
      <CursorArrow targetRef={ctaRef} />

      {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50">
              <Preloader />
          </div>
      )}

      <div className={cn("relative z-10 flex flex-col items-center justify-center gap-6 transition-opacity duration-1000", isLoading && "opacity-0")}>
        {isLogoVisible && homeLogoUrl && (
            <div className="w-full max-w-sm">
                <Logo src={homeLogoUrl} />
            </div>
        )}
        <div className="text-center space-y-3 max-w-lg">
            <h2 className="text-xl md:text-2xl font-headline tracking-tight text-white/90">
                {t('home.hero.heading')}
            </h2>
            <p className="text-sm md:text-base text-foreground/60 leading-relaxed">
                {t('home.hero.subtitle')}
            </p>
        </div>
        <Button ref={ctaRef} asChild size="lg" className="group">
          <Link href="/work">
            {t('home.hero.cta')}
            <FontAwesomeIcon icon={faArrowRight} className="ml-2 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
        <div className="pt-4 text-foreground/40 text-xs animate-pulse">
            {t('home.hero.scroll')}
        </div>
      </div>
    </div>
  );
}
