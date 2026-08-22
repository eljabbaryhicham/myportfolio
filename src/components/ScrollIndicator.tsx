
'use client';

import { useState, useEffect, type RefObject, useRef } from 'react';
import { doc } from 'firebase/firestore';
import Lottie from 'lottie-react';
import { motion, AnimatePresence } from 'framer-motion';
import animationData from '@/lib/arrow-animation.json';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';

interface ScrollIndicatorProps {
    scrollRef: RefObject<HTMLDivElement>;
}

interface ArrowSettings {
  isArrowAnimationEnabled?: boolean;
  arrowLottieUrl?: string;
}

export function ScrollIndicator({ scrollRef }: ScrollIndicatorProps) {
  const [isVisible, setIsVisible] = useState(true);
  const isMobile = useIsMobile();
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

  const firestore = useFirestore();
  const settingsDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
    [firestore]
  );
  const { data: homeSettings } = useDoc<ArrowSettings>(settingsDocRef);

  const enabled = homeSettings?.isArrowAnimationEnabled ?? true;
  const animationUrl = homeSettings?.arrowLottieUrl || '';

  const [customAnim, setCustomAnim] = useState<any>(null);
  const [customGif, setCustomGif] = useState<string | null>(null);

  useEffect(() => {
    if (!animationUrl) { setCustomAnim(null); setCustomGif(null); return; }
    if (/\.gif$/i.test(animationUrl)) {
      setCustomGif(animationUrl);
      setCustomAnim(null);
      return;
    }
    let disposed = false;
    fetch(animationUrl)
      .then(r => r.json())
      .then(data => { if (!disposed) { setCustomAnim(data); setCustomGif(null); } })
      .catch(() => {});
    return () => { disposed = true; };
  }, [animationUrl]);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement || isMobile === false) {
      setIsVisible(false);
      return;
    }

    const resetTimer = () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      inactivityTimer.current = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    };

    const handleScroll = () => {
      // Check if user is at the bottom of the scrollable element.
      const isAtBottom =
        scrollElement.scrollTop + scrollElement.clientHeight >= scrollElement.scrollHeight - 5;

      if (isAtBottom) {
        setIsVisible(false);
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      } else {
        setIsVisible(true);
        resetTimer();
      }
    };

    // Initial setup
    if (scrollElement.scrollHeight <= scrollElement.clientHeight) {
        setIsVisible(false);
    } else {
        setIsVisible(true);
        resetTimer(); // Start the timer on initial load
    }

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, [isMobile, scrollRef]);

  // Don't render anything on the server, if not mobile, or if disabled in admin.
  if (isMobile !== true || !enabled) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-16 right-4 z-50 pointer-events-none"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
          <div className="w-16 h-16">
            {customGif ? (
              <img src={customGif} alt="" className="w-full h-full object-contain" />
            ) : (
              <Lottie animationData={customAnim || animationData} loop={true} />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
