
'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import Preloader from './preloader';

interface VideoPlayerProps {
  src?: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  showControls?: boolean;
}

const VideoPlayer = ({
  src,
  poster,
  className,
  autoPlay = false,
  muted = false,
  loop = false,
  showControls = true,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);


  if (!src) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <Preloader />
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full bg-black overflow-hidden", className)}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        playsInline
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        controls={showControls}
      />
    </div>
  );
};

export default VideoPlayer;
