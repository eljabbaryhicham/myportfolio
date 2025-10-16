
'use client';

import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

const variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.33, 1, 0.68, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.5,
      ease: [0.33, 1, 0.68, 1],
    },
  },
};

const liquidVariants = {
  initial: (direction: number) => ({
    top: direction > 0 ? '100%' : '-100%',
    bottom: direction > 0 ? 'auto' : '0',
    height: '100%',
  }),
  animate: {
    top: ['100%', '0%', '0%', '-100%'],
    height: ['100%', '100%', '100%', '100%'],
    transition: {
      duration: 1.2,
      times: [0, 0.4, 0.6, 1],
      ease: [0.33, 1, 0.68, 1],
    },
  },
};


export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <div className="liquid-transition-container">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname + '-liquid'}
            custom={1}
            variants={liquidVariants}
            initial="initial"
            animate="animate"
            className="liquid-transition-fg"
          />
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          variants={variants}
          initial="initial"
          animate="enter"
          exit="exit"
          className="h-full w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
