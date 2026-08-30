'use client';

import { useMemo, useId, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getLocalizedString } from "@/lib/i18n/multilingual";
import { useTrustedByClients } from "@/components/trusted-by/trusted-by-provider";

export default function TrustedBy() {
  const { t, lang } = useTranslation();
  const { clients } = useTrustedByClients();
  const uid = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [mobileHovered, setMobileHovered] = useState(false);
  const [desktopHovered, setDesktopHovered] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { rootMargin: '100px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const setPlay = (id: string, running: boolean) => {
      const e = document.getElementById(id);
      if (e) e.style.animationPlayState = running ? 'running' : 'paused';
    };
    setPlay(`m-${uid}`, isInView && !mobileHovered);
    setPlay(`d-${uid}`, isInView && !desktopHovered);
  }, [isInView, mobileHovered, desktopHovered, uid]);

  const visibleClients = useMemo(
    () => (clients || []).filter((c) => c.isVisible !== false),
    [clients]
  );

  const names = visibleClients.map((c) => getLocalizedString(c.name, lang));
  if (names.length === 0) return null;

  return (
    <div ref={wrapRef}>
      <style>{`@keyframes r2l{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>

      <motion.section
        className="border-t border-b border-white/10 py-5 w-full md:hidden"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        onMouseEnter={() => setMobileHovered(true)}
        onMouseLeave={() => setMobileHovered(false)}
      >
        <p className="text-white/40 text-xs uppercase mb-4 text-center" style={{ letterSpacing: "0.2em" }}>
          {t('home.trustedBy')}
        </p>
        <div style={{ overflow: "hidden", whiteSpace: "nowrap", width: "100%" }}>
          <div id={`m-${uid}`} className="inline-flex gap-x-8 md:gap-x-16" style={{ animation: "r2l 30s linear infinite" }}>
            {[...names, ...names].map((name, i) => (
              <span key={`${name}-${i}`} className="text-white/70 text-sm font-medium uppercase" style={{ letterSpacing: "0.15em" }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Desktop */}
      <motion.section
        className="hidden md:block w-full border-t border-b border-white/10 py-5"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        onMouseEnter={() => setDesktopHovered(true)}
        onMouseLeave={() => setDesktopHovered(false)}
      >
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-white/40 text-xs uppercase mb-4 text-center" style={{ letterSpacing: "0.2em" }}>
            {t('home.trustedBy')}
          </p>
          <div style={{ overflow: "hidden", whiteSpace: "nowrap", width: "100%" }}>
            <div id={`d-${uid}`} className="inline-flex" style={{ gap: "64px", animation: "r2l 30s linear infinite" }}>
              {[...names, ...names].map((name, i) => (
                <span key={`${name}-${i}`} className="text-white/70 text-sm font-medium uppercase" style={{ letterSpacing: "0.15em" }}>
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
