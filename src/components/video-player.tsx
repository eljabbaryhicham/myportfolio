
'use client';

import React, { useEffect, useRef } from 'react';
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
  onReady?: () => void;
}

const VideoPlayer = ({
  source,
  poster,
  previewThumbnailsSrc,
  autoplay,
  loop,
  muted,
  controls = true,
  onReady,
}: VideoPlayerProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // Create the video element manually
    const videoElement = document.createElement('video');
    videoElement.playsInline = true;
    videoElement.controls = controls;
    videoElement.autoplay = autoplay || false;
    videoElement.loop = loop || false;
    videoElement.muted = muted || false;
    if (poster) {
      videoElement.poster = poster;
    }

    // Append it to the wrapper div managed by React
    wrapper.appendChild(videoElement);

    const useThumbnails = !isMobile && !!previewThumbnailsSrc;

    const options: Options = {
      settings: ['quality', 'speed', 'loop'],
      quality: {
        default: isMobile ? 576 : 1080,
        options: [4320, 2160, 1440, 1080, 720, 576, 480, 360, 240],
      },
      previewThumbnails: {
        enabled: useThumbnails,
        src: useThumbnails ? previewThumbnailsSrc! : '',
      },
      fullscreen: {
        enabled: true,
        fallback: true,
        iosNative: true,
      },
      autoplay: autoplay || false,
      loop: { active: loop || false },
      muted: muted || false,
      controls: controls
        ? [
            'play-large',
            'play',
            'progress',
            'current-time',
            'mute',
            'volume',
            'captions',
            'settings',
            'pip',
            'airplay',
            'fullscreen',
          ]
        : [],
    };

    // Initialize Plyr on the manually created element
    const player = new Plyr(videoElement, options);
    playerRef.current = player;
    player.source = source;

    if (onReady) {
        player.on('ready', onReady);
    }


    // The cleanup function is critical
    return () => {
      if (playerRef.current) {
        // Destroy the player instance. Plyr handles the removal
        // of the video element and its own UI.
        playerRef.current.destroy();
        playerRef.current = null;
      }
      // Ensure the wrapper is clean for the next render.
      if (wrapper) {
        wrapper.innerHTML = '';
      }
    };
    // We only want this effect to run once on mount, and clean up on unmount.
    // The source update is handled internally by Plyr after initialization.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, isMobile]); // Re-run if the source or mobile status changes

  // This div is the stable container that React will manage.
  return <div ref={wrapperRef} className="plyr-react plyr" />;
};

export default VideoPlayer;
