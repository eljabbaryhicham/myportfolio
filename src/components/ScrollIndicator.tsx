
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
    const handleScroll = () => {
      // Check if the user has scrolled to the bottom of the page
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const scrollTop = window.scrollY;
      
      // Hide when user is at the bottom of the page (with a small 10px buffer)
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Initial check in case the page content is shorter than the viewport
    handleScroll();

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
