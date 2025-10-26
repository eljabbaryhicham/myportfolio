
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
    // If it's not mobile (or check is still pending), don't run the scroll logic.
    if (!isMobile) {
      // Ensure it's hidden if we switch from mobile to desktop view.
      if (isVisible) setIsVisible(false);
      return;
    }

    const handleScroll = () => {
      // Check if user is at the bottom of the page
      // Using document.body.offsetHeight is often more reliable than scrollHeight
      const isAtBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight;

      // Hide if at bottom, show if not
      if (isAtBottom && isVisible) {
        setIsVisible(false);
      } else if (!isAtBottom && !isVisible) {
        setIsVisible(true);
      }
    };
    
    // Initial check in case the page is not scrollable at all
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMobile, isVisible]); // isVisible is needed to avoid stale state in the condition checks inside handleScroll

  // Only render the component if on a mobile device
  if (!isMobile) {
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
