
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
    // If not on mobile, do nothing.
    if (isMobile === false) {
      return;
    }

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const scrollTop = window.scrollY;
      
      // Check if user is at the bottom of the page (with a 10px buffer)
      const atBottom = scrollTop + clientHeight >= scrollHeight - 10;
      
      // Use functional update to avoid needing isVisible in dependency array
      setIsVisible(prevIsVisible => {
        if (atBottom && prevIsVisible) {
          return false; // Hide if at bottom
        } else if (!atBottom && !prevIsVisible) {
          return true; // Show if not at bottom
        }
        return prevIsVisible; // No change
      });
    };
    
    // Initial check in case the page is not scrollable from the start
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMobile]); // Effect now only depends on isMobile status

  // Don't render the component at all on non-mobile devices.
  if (isMobile === false) {
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
