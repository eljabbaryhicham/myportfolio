'use client';

import { useMemo, useId } from "react";
import { motion } from "framer-motion";
import { useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getLocalizedString, type MultilingualString } from "@/lib/i18n/multilingual";

interface Client {
  id: string;
  name: MultilingualString;
  logoUrl: string;
  order: number;
  isVisible?: boolean;
}

export default function TrustedBy() {
  const firestore = useFirestore();
  const { t, lang } = useTranslation();
  const uid = useId();

  const clientsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'clients'), orderBy('order')) : null,
    [firestore]
  );
  const { data: clients } = useCollection<Client>(clientsQuery);

  const visibleClients = useMemo(
    () => (clients || []).filter((c) => c.isVisible !== false),
    [clients]
  );

  const names = visibleClients.map((c) => getLocalizedString(c.name, lang));
  if (names.length === 0) return null;

  return (
    <>
      <style>{`@keyframes r2l{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>

      <motion.section
        className="border-t border-b border-white/10 py-5 w-full md:hidden"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        onMouseEnter={() => { const e = document.getElementById(`m-${uid}`); if (e) e.style.animationPlayState = 'paused'; }}
        onMouseLeave={() => { const e = document.getElementById(`m-${uid}`); if (e) e.style.animationPlayState = 'running'; }}
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
        onMouseEnter={() => { const e = document.getElementById(`d-${uid}`); if (e) e.style.animationPlayState = 'paused'; }}
        onMouseLeave={() => { const e = document.getElementById(`d-${uid}`); if (e) e.style.animationPlayState = 'running'; }}
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
    </>
  );
}
