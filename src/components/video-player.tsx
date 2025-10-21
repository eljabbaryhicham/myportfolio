
'use client';

import React, { useEffect, useRef } from 'react';
import Plyr, { Options, SourceInfo } from 'plyr';
import 'plyr-react/plyr.css';
import Hls from 'hls.js';

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

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !source || wrapper.querySelector('video')) return;

    const videoElement = document.createElement('video');
    videoElement.playsInline = true;
    videoElement.controls = false; 
    videoElement.poster = poster;
    wrapper.appendChild(videoElement);

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
        enabled: !!previewThumbnailsSrc,
        src: previewThumbnailsSrc || '',
      },
      fullscreen: {
        enabled: true,
        fallback: true,
        iosNative: true,
      },
      controls: controls
        ? [
            'play-large', 'play', 'progress', 'current-time',
            'mute', 'volume', 'captions', 'settings', 'pip',
            'airplay', 'fullscreen',
          ]
        : [],
    };
    
    const plyrPlayer = new Plyr(videoElement, options);
    playerRef.current = plyrPlayer;

    const firstSource = source.sources[0];
    if (firstSource && firstSource.src) {
        // Only use HLS for Cloudinary URLs
        if (firstSource.src.includes('res.cloudinary.com') && Hls.isSupported()) {
            const hls = new Hls();
            
            // Correctly transform the URL to get the HLS manifest
            // e.g., https://res.cloudinary.com/.../upload/v123/video.mp4
            // becomes https://res.cloudinary.com/.../upload/f_auto,q_auto/v123/video.m3u8
            const hlsUrl = firstSource.src
                .replace(/\.mp4$/, '.m3u8')
                .replace('/upload/', '/upload/f_auto,q_auto/');

            hls.loadSource(hlsUrl);
            hls.attachMedia(videoElement);
            // @ts-ignore
            window.hls = hls;
        } else {
            plyrPlayer.source = source;
        }
    }
    
    if (onReady) {
        plyrPlayer.once('ready', onReady);
    }
    
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      if (wrapper) {
        wrapper.innerHTML = '';
      }
    };
  }, [source, poster, previewThumbnailsSrc, autoplay, loop, muted, controls, onReady]);

  return <div ref={wrapperRef} className="plyr-react plyr" />;
};

export default VideoPlayer;
