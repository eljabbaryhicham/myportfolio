'use client';

import Lottie from 'lottie-react';
import animationData from '@/lib/preloader-animation.json';

const Preloader = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="w-64 h-64">
        <Lottie animationData={animationData} loop={true} />
      </div>
    </div>
  );
};

export default Preloader;
