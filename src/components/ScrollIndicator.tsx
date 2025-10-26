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
    // If not mobile, don't show the indicator.
    if (isMobile === false) {
      if (isVisible) setIsVisible(false);
      return;
    }

    const handleScroll = () => {
      // Check if user is at the bottom of the page.
      // A small buffer (e.g., 5px) can help with rounding issues.
      const isAtBottom = 
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 5;

      // Hide if at bottom, show if not.
      if (isAtBottom && isVisible) {
        setIsVisible(false);
      } else if (!isAtBottom && !isVisible) {
        setIsVisible(true);
      }
    };
    
    // Initial check in case the page is not scrollable at all.
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMobile, isVisible]); // Re-run when isMobile is determined or isVisible changes.

  // Don't render anything on the server or if not mobile.
  if (isMobile !== true) {
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
          <div className="w-24 h-24">
            <Lottie animationData={animationData} loop={true} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
