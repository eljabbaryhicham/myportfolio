
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Plyr, { Options, SourceInfo } from 'plyr';
import 'plyr-react/plyr.css';

interface VideoPlayerProps {
  source: SourceInfo;
  poster?: string;
  previewThumbnailsSrc?: string;
}

const VideoPlayer = ({ source, poster, previewThumbnailsSrc }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !videoRef.current) {
      return;
    }

    const videoElement = videoRef.current;
    
    // Ensure any existing player instance is destroyed before creating a new one.
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    const options: Options = {
      // debug: true,
      settings: ['quality', 'speed', 'loop'],
      quality: {
        default: 576,
        // The options are set by Plyr automatically based on the source
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

    // Set the source for the new Plyr instance
    if (source) {
      playerRef.current.source = source;
    }

    // Cleanup function to destroy the player on component unmount
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isMounted, source, previewThumbnailsSrc]); // Re-run effect if source or thumbnails change

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

    