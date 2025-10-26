
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
    // Hide after 2 seconds initially to avoid it staying on short pages
    const initialTimer = setTimeout(() => {
        // If user hasn't scrolled far enough, it will be hidden by this.
        // If they have, the scroll listener will have already taken over.
        handleScroll();
    }, 2000);

    const handleScroll = () => {
      // Check if the user has scrolled to the bottom of the page
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const scrollTop = window.scrollY;
      
      // Hide when user is near the bottom of the page (within 100px)
      if (scrollHeight - (scrollTop + clientHeight) < 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    };
    
    window.addEventListener('scroll', handleScroll);

    // Cleanup
    return () => {
      clearTimeout(initialTimer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
