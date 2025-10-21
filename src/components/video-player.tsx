
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
  const hlsRef = useRef<Hls | null>(null);

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
    
    playerRef.current = new Plyr(videoElement, options);

    const firstSource = source.sources[0];
    if (firstSource && firstSource.src) {
        if (firstSource.src.includes('res.cloudinary.com') && Hls.isSupported()) {
            const hls = new Hls();
            hlsRef.current = hls;
            
            const hlsUrl = firstSource.src
                .replace('/upload/', '/upload/f_auto,q_auto/')
                .replace(/\.(mp4|mov|webm)$/, '.m3u8');
                
            hls.loadSource(hlsUrl);
            hls.attachMedia(videoElement);
        } else {
            playerRef.current.source = source;
        }
    }
    
    if (onReady && playerRef.current) {
        playerRef.current.once('ready', onReady);
    }
    
    return () => {
      // Destroy HLS instance first
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      // Then destroy Plyr instance
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      // Finally, clean up the DOM
      if (wrapper) {
        wrapper.innerHTML = '';
      }
    };
  }, [source, poster, previewThumbnailsSrc, autoplay, loop, muted, controls, onReady]);

  return <div ref={wrapperRef} className="plyr-react plyr" />;
};

export default VideoPlayer;
