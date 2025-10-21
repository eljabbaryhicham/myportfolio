
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
          playsinline: true,
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
      if (!wrapper || wrapper.querySelector('video')) return;

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
            default: 480,
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
      
      // Forcefully set the poster after initialization to ensure it's displayed.
      if (poster) {
        plyrPlayer.once('ready', () => {
          const posterElement = plyrPlayer.elements.poster as HTMLElement;
          if (posterElement) {
            posterElement.style.backgroundImage = `url(${poster})`;
            // Keep the poster visible until play is pressed
            plyrPlayer.elements.container.classList.add('plyr--poster-visible');
          }
          if (onReady) {
            onReady();
          }
        });

        // Hide poster on play
        plyrPlayer.on('play', () => {
          plyrPlayer.elements.container.classList.remove('plyr--poster-visible');
        });
        
        // Also update it if the source changes
        plyrPlayer.on('sourcechange', () => {
            const posterElement = plyrPlayer.elements.poster as HTMLElement;
            if (posterElement) {
                posterElement.style.backgroundImage = `url(${poster})`;
                plyrPlayer.elements.container.classList.add('plyr--poster-visible');
            }
        });
      } else if (onReady) {
        plyrPlayer.once('ready', onReady);
      }

      return () => {
        if (playerRef.current && playerRef.current instanceof Plyr) {
          playerRef.current.destroy();
          playerRef.current = null;
        }
        if (wrapper) {
            wrapper.innerHTML = '';
        }
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, source?.sources[0]?.src, previewThumbnailsSrc, poster]);
  
  if (isMobile) {
    return <div ref={videoRef} className="w-full h-full object-contain" />;
  }

  return <div ref={wrapperRef} className="plyr-react plyr" />;
};

export default VideoPlayer;
