
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
    if (!isMounted || !videoRef.current || !source) {
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
        default: 576, // A default quality
        options: [4320, 2160, 1440, 1080, 720, 576, 480, 360, 240], // All possible qualities
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
    
    // Initialize the player. It will pick up the source from the <video> element.
    playerRef.current = new Plyr(videoElement, options);

    // Now, set the source on the Plyr instance. This is the correct way
    // to load content dynamically after initialization, especially for YouTube/Vimeo.
    playerRef.current.source = source;

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
      // The initial source can be set here, but Plyr will manage it.
      // This helps with server-side rendering and initial setup.
    />
  );
};

export default VideoPlayer;
