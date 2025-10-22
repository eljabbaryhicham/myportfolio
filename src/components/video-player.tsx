
'use client';

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import 'shaka-player/dist/controls.css';
import Preloader from './preloader';
import { useIsMobile } from '@/hooks/use-mobile';

interface VideoPlayerProps {
  src?: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  preloadManager?: shaka.media.PreloadManager; // Accept a preload manager
}

const VideoPlayer = ({
  src,
  poster,
  className,
  autoPlay = false,
  muted = false,
  loop = false,
  controls = true,
  preloadManager,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isBuffering, setIsBuffering] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!videoRef.current || !containerRef.current) return;

    let player: shaka.Player | null = null;
    let ui: shaka.ui.Overlay | null = null;

    const initPlayer = async () => {
        const shaka = await import('shaka-player/dist/shaka-player.ui');

        shaka.polyfill.installAll();
        if (!shaka.Player.isBrowserSupported()) {
            console.error('Browser not supported!');
            return;
        }
        
        player = new shaka.Player(videoRef.current);

        // Add buffering event listeners
        player.addEventListener('buffering', (e) => {
            setIsBuffering(e.buffering);
        });
        
        if (videoRef.current) {
            videoRef.current.volume = 0.10;
        }

        if (controls) {
            ui = new shaka.ui.Overlay(player, containerRef.current, videoRef.current);
            const uiConfig: shaka.extern.UIConfiguration = {
                seekBarColors: {
                    base: 'rgba(255, 255, 255, 0.2)',
                    buffered: 'rgba(255, 255, 255, 0.4)',
                    played: 'hsl(var(--primary))',
                },
                volumeBarColors: {
                    base: 'rgba(255, 255, 255, 0.2)',
                    level: 'hsl(var(--primary))',
                },
                controlPanelElements: isMobile
                    ? ['play_pause', 'time_and_duration', 'fullscreen', 'overflow_menu']
                    : ['play_pause', 'time_and_duration', 'spacer', 'volume', 'fullscreen', 'overflow_menu'],
                overflowMenuButtons: ['quality', 'picture_in_picture', 'loop', 'captions', 'playback_rate'],
            };
            ui.configure(uiConfig);
        }

        const onError = (error: any) => {
            console.error('Error code', error.code, 'object', error);
        }
        
        player.addEventListener('error', onError);

        player.configure({
            drm: {
                servers: {},
                clearKeys: {}
            }
        });

        try {
            if (preloadManager) {
                await player.load(preloadManager);
            } else if (src) {
                await player.load(src);
            }
        } catch (e) {
            onError(e);
        }
    };

    initPlayer();

    return () => {
      if (ui) {
        ui.destroy();
      }
      if (player) {
        player.destroy();
      }
    };
  }, [src, controls, preloadManager, isMobile]);

  return (
    <div ref={containerRef} className={cn("relative w-full h-full bg-black", className)}>
      {isBuffering && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
          <Preloader />
        </div>
      )}
      <video
        ref={videoRef}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline
        className="w-full h-full"
      />
    </div>
  );
};

export default VideoPlayer;
