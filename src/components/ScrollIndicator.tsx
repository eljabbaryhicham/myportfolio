'use client';

import { useState, useEffect, type RefObject } from 'react';
import Lottie from 'lottie-react';
import { motion, AnimatePresence } from 'framer-motion';
import animationData from '@/lib/arrow-animation.json';
import { useIsMobile } from '@/hooks/use-mobile';

interface ScrollIndicatorProps {
    scrollRef: RefObject<HTMLDivElement>;
}

export function ScrollIndicator({ scrollRef }: ScrollIndicatorProps) {
  const [isVisible, setIsVisible] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement || isMobile === false) {
      setIsVisible(false);
      return;
    }

    const handleScroll = () => {
      // Check if user is at the bottom of the scrollable element.
      // A small buffer (e.g., 5px) can help with rounding issues.
      const isAtBottom =
        scrollElement.scrollTop + scrollElement.clientHeight >= scrollElement.scrollHeight - 5;
      
      if (isAtBottom && isVisible) {
        setIsVisible(false);
      } else if (!isAtBottom && !isVisible) {
        setIsVisible(true);
      }
    };
    
    // Initial check in case the content is not scrollable.
    if (scrollElement.scrollHeight <= scrollElement.clientHeight) {
        setIsVisible(false);
    } else {
        handleScroll(); // Run once to set initial state correctly
    }

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [isMobile, isVisible, scrollRef]);

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
          <div className="w-16 h-16">
            <Lottie animationData={animationData} loop={true} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
