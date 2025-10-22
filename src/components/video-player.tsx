
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

    let player: shaka.Player | null = null;
    let ui: shaka.ui.Overlay | null = null;

    import('shaka-player/dist/shaka-player.ui').then(shaka => {
      if (!videoRef.current || !containerRef.current) return;

      shaka.polyfill.installAll();
      if (!shaka.Player.isBrowserSupported()) {
        console.error('Browser not supported!');
        return;
      }

      player = new shaka.Player(videoRef.current);
      
      if (videoRef.current) {
        videoRef.current.volume = 0.10;
      }

      if (controls) {
        ui = new shaka.ui.Overlay(player, containerRef.current, videoRef.current);
        
        // Configure the UI colors programmatically
        const uiConfig: shaka.extern.UIConfiguration = {
          seekBarColors: {
            base: 'rgba(255, 255, 255, 0.2)', // A light, translucent base
            buffered: 'rgba(255, 255, 255, 0.4)', // A slightly more opaque buffered color
            played: 'hsl(var(--primary))', // Use the app's primary red color
          },
          volumeBarColors: {
            base: 'rgba(255, 255, 255, 0.2)',
            level: 'hsl(var(--primary))',
          },
          // Add overflow menu to main controls
          controlPanelElements: [
            'play_pause',
            'time_and_duration',
            'spacer',
            'volume',
            'fullscreen',
            'overflow_menu',
          ],
          // Add quality and PiP buttons to the overflow menu
          overflowMenuButtons: ['quality', 'picture_in_picture', 'loop', 'captions', 'playback_rate'],
        };
        ui.configure(uiConfig);
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

    });

    return () => {
      if (ui) {
        ui.destroy();
      }
      if (player) {
        player.destroy();
      }
    };

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
