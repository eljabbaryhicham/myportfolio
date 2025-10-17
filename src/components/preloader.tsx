
'use client';

import Lottie from 'lottie-react';
import { AnimatePresence, motion } from 'framer-motion';
import animationData from '@/lib/preloader-animation.json';

interface PreloaderProps {
  isVisible: boolean;
  isFullScreen?: boolean;
}

const Preloader: React.FC<PreloaderProps> = ({ isVisible, isFullScreen = false }) => {
  const containerClasses = isFullScreen
    ? "fixed inset-0 z-[200] flex items-center justify-center"
    : "flex items-center justify-center";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={containerClasses}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-48 h-48">
            <Lottie animationData={animationData} loop={true} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;
