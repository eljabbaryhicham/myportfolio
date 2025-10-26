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
    // Only run this logic on mobile devices
    if (isMobile) {
      const handleScroll = () => {
        // A small buffer to ensure it triggers slightly before the absolute end
        const bottomOffset = 10; 
        const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - bottomOffset;
        
        // Hide if at the bottom, show if not
        if (isAtBottom) {
          setIsVisible(false);
        } else {
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
    } else {
      // If not mobile, always ensure it's not visible
      setIsVisible(false);
    }
  }, [isMobile]); // Rerun the effect if the mobile status changes

  // We use AnimatePresence to smoothly fade the indicator in and out.
  return (
    <AnimatePresence>
      {isVisible && isMobile && (
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
