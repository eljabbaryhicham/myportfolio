
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Plyr, { Options, SourceInfo } from 'plyr';
import 'plyr-react/plyr.css';
import { useIsMobile } from '@/hooks/use-mobile';

interface VideoPlayerProps {
  source: SourceInfo;
  poster?: string;
  previewThumbnailsSrc?: string;
}

const VideoPlayer = ({ source, poster, previewThumbnailsSrc }: VideoPlayerProps) => {
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
        // Set a lower default quality for mobile and a higher one for desktop
        default: isMobile ? 576 : 1080, 
        // All available options
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
    };
    
    playerRef.current = new Plyr(videoElement, options);

    playerRef.current.source = source;

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isMounted, source, previewThumbnailsSrc, isMobile]); // Re-run effect if isMobile changes

  return (
    <video
      ref={videoRef}
      className="plyr-react plyr"
      poster={poster}
      playsInline
      controls
    />
  );
};

export default VideoPlayer;
