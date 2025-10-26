
'use client';

import { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { motion, AnimatePresence } from 'framer-motion';
import animationData from '@/lib/arrow-animation.json';
import { useIsMobile } from '@/hooks/use-mobile';

export function ScrollIndicator() {
  const [isVisible, setIsVisible] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile === false) {
      // If we know it's not mobile, ensure it's not visible and do nothing else.
      setIsVisible(false);
      return;
    }

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const scrollTop = window.scrollY;

      // Hide when user is at the bottom (with a 10px buffer)
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    };

    // Run the check once in case the page isn't scrollable
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMobile]); // Only re-run if isMobile status changes.

  // Render nothing if it's not supposed to be visible.
  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-16 right-4 z-50 pointer-events-none"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        <div className="w-24 h-24">
          <Lottie animationData={animationData} loop={true} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
