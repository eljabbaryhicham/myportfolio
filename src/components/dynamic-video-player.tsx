
'use client';

import dynamic from 'next/dynamic';
import Preloader from './preloader';

const DynamicVideoPlayer = dynamic(() => import('./video-player'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-black"><Preloader /></div>,
});

export default DynamicVideoPlayer;
