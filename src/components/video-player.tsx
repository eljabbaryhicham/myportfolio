
'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
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

  useEffect(() => {
    if (!videoRef.current) return;

    const player = new Plyr(videoRef.current, {
      controls: showControls
        ? [
            'play-large',
            'play',
            'progress',
            'current-time',
            'mute',
            'volume',
            'fullscreen',
          ]
        : [],
      autoplay: autoPlay,
      muted: muted,
      loop: { active: loop },
      playsinline: true,
    });
    
    return () => {
      player.destroy();
    };
  }, [src, poster, autoPlay, muted, loop, showControls]); // Re-init if essential props change

  if (!src) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <Preloader />
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full bg-black overflow-hidden [&>div]:h-full", className)}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="plyr-react plyr"
        playsInline
      />
    </div>
  );
};

export default VideoPlayer;
