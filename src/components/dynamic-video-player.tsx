
'use client';

import dynamic from 'next/dynamic';
import Preloader from './preloader';

// The 'shaka' type is not available in this scope, so we use 'any'
// for the preloadManager prop. The actual VideoPlayer component will have the correct type.
const DynamicVideoPlayer = dynamic(() => import('./video-player'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-black"><Preloader /></div>,
});

export default DynamicVideoPlayer;
