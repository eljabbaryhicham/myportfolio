
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Plyr, { Options, SourceInfo } from 'plyr';
import 'plyr-react/plyr.css';
import { useIsMobile } from '@/hooks/use-mobile';

interface VideoPlayerProps {
  source: SourceInfo;
  poster?: string;
  previewThumbnailsSrc?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
}

const VideoPlayer = ({ source, poster, previewThumbnailsSrc, autoplay, loop, muted, controls = true }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !videoRef.current || !source) {
      return;
    }

    const videoElement = videoRef.current;
    
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    const options: Options = {
      settings: ['quality', 'speed', 'loop'],
      quality: {
        default: isMobile ? 576 : 1080, 
        options: [4320, 2160, 1440, 1080, 720, 576, 480, 360, 240], 
      },
      previewThumbnails: {
        enabled: !!previewThumbnailsSrc,
        src: previewThumbnailsSrc || '',
      },
      fullscreen: {
        enabled: true,
        fallback: true,
        iosNative: true,
      },
      autoplay: autoplay || false,
      loop: { active: loop || false },
      muted: muted || false,
      controls: controls ? ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'] : [],
    };
    
    playerRef.current = new Plyr(videoElement, options);

    playerRef.current.source = source;

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isMounted, source, previewThumbnailsSrc, isMobile, autoplay, loop, muted, controls]);

  return (
    <video
      ref={videoRef}
      className="plyr-react plyr"
      poster={poster}
      playsInline
      controls={controls}
      autoPlay={autoplay}
      loop={loop}
      muted={muted}
    />
  );
};

export default VideoPlayer;
