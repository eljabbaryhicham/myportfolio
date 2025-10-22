'use client';

import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import 'shaka-player/dist/controls.css';

interface VideoPlayerProps {
  src?: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
}

const VideoPlayer = ({
  src,
  poster,
  className,
  autoPlay = false,
  muted = false,
  loop = false,
  controls = true,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!videoRef.current || !containerRef.current || !src) return;

    // Dynamically import shaka-player only on the client side
    import('shaka-player/dist/shaka-player.ui').then(shaka => {
      if (!videoRef.current || !containerRef.current) return;

      shaka.polyfill.installAll();
      if (!shaka.Player.isBrowserSupported()) {
        console.error('Browser not supported!');
        return;
      }

      const player = new shaka.Player(videoRef.current);
      let ui: shaka.ui.Overlay | null = null;

      if (controls) {
        ui = new shaka.ui.Overlay(player, containerRef.current, videoRef.current);
      }

      const onError = (error: any) => {
          console.error('Error code', error.code, 'object', error);
      }
      
      player.addEventListener('error', onError);

      // Configure the player to not use DRM.
      player.configure({
        drm: {
          servers: {},
          clearKeys: {}
        }
      });

      player.load(src).catch(onError);

      return () => {
        if (ui) {
          ui.destroy();
        }
        player.destroy();
      };
    });

  }, [src, controls]);

  return (
    <div ref={containerRef} className={cn("relative w-full h-full", className)}>
      <video
        ref={videoRef}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        // The 'controls' attribute is handled by the Shaka UI
        className="w-full h-full"
      />
    </div>
  );
};

export default VideoPlayer;
