
'use client';

import React, { useEffect, useRef } from 'react';
import Plyr, { Options, SourceInfo } from 'plyr';
import 'plyr-react/plyr.css';
import { useIsMobile } from '@/hooks/use-mobile';
import Player from 'xgplayer';
import 'xgplayer/dist/index.min.css';

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
  const playerRef = useRef<Plyr | Player | null>(null);
  const isMobile = useIsMobile();
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // This effect should only re-run if the device type (mobile/desktop) or the main source URL changes.
    // Other props are passed during initialization but don't need to trigger re-initialization.

    if (isMobile) {
      if (videoRef.current && !playerRef.current) {
        const videoSourceUrl = source.sources[0]?.src;
        if (!videoSourceUrl) return;

        const xgPlayer = new Player({
          el: videoRef.current,
          url: videoSourceUrl,
          poster: poster,
          autoplay: autoplay,
          loop: loop,
          muted: muted,
          playsinline: true, // Important for iOS
          height: '100%',
          width: '100%',
          controls: controls,
        });

        playerRef.current = xgPlayer;

        if (onReady) {
          xgPlayer.once('ready', onReady);
        }
      }

      return () => {
        if (playerRef.current && playerRef.current instanceof Player) {
          playerRef.current.destroy();
          playerRef.current = null;
        }
      };

    } else { // Desktop Plyr implementation
      const wrapper = wrapperRef.current;
      if (!wrapper || wrapper.querySelector('video')) return; // Prevent re-init if video exists

      const videoElement = document.createElement('video');
      videoElement.playsInline = true;
      videoElement.controls = controls;
      wrapper.appendChild(videoElement);
      
      const useThumbnails = !isMobile && !!previewThumbnailsSrc;
      
      const options: Options = {
          autoplay: autoplay || false,
          loop: { active: loop || false },
          muted: muted || false,
          settings: ['quality', 'speed', 'loop'],
          quality: {
            default: 720,
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
      
      const plyrPlayer = new Plyr(videoElement, options);
      playerRef.current = plyrPlayer;
      
      if(source) {
          plyrPlayer.source = source;
      }
      if(poster) {
          videoElement.poster = poster;
      }

      if (onReady) {
        plyrPlayer.on('ready', onReady);
      }

      return () => {
        if (playerRef.current && playerRef.current instanceof Plyr) {
          playerRef.current.destroy();
          playerRef.current = null;
        }
        if (wrapper) {
            // Clean up the container to avoid lingering elements on re-render
            wrapper.innerHTML = '';
        }
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, source?.sources[0]?.src, previewThumbnailsSrc]);
  
  if (isMobile) {
    return <div ref={videoRef} className="w-full h-full object-contain" />;
  }

  return <div ref={wrapperRef} className="plyr-react plyr" />;
};

export default VideoPlayer;
