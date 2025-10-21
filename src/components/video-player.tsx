
'use client';

import React, { useEffect, useRef } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import Hls from 'hls.js';

interface VideoPlayerProps {
  source: {
    type: 'video';
    sources: {
      src: string;
      provider?: 'youtube' | 'vimeo';
      size?: number;
    }[];
  };
  poster?: string;
  onReady?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ source, poster, onReady }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // --- 1. Cleanup previous instances ---
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const firstSource = source.sources[0];
    if (!firstSource) return;

    const isHls = firstSource.src.includes('.m3u8');

    // --- 2. Setup for HLS streams ---
    if (isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(firstSource.src);
        hls.attachMedia(videoElement);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          const plyrPlayer = new Plyr(videoElement, {
             captions: { active: true, update: true, language: 'en' },
          });
          playerRef.current = plyrPlayer;
          onReady?.();
        });
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        // --- 3. Native HLS support (Safari) ---
        videoElement.src = firstSource.src;
        videoElement.addEventListener('loadedmetadata', () => {
          const plyrPlayer = new Plyr(videoElement, {});
          playerRef.current = plyrPlayer;
          onReady?.();
        });
      }
    } else {
      // --- 4. Setup for non-HLS (MP4, YouTube, Vimeo) ---
      videoElement.removeAttribute('src'); // Clear src for Plyr to handle it
      const plyrPlayer = new Plyr(videoElement, {
        source: source as Plyr.SourceInfo,
      });
      playerRef.current = plyrPlayer;
       playerRef.current.on('ready', () => {
         onReady?.();
       });
    }

    // --- 5. Final Cleanup ---
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [source, onReady]);

  return (
      <div className="w-full h-full bg-black">
        <video ref={videoRef} className="w-full h-full" poster={poster} playsInline controls />
      </div>
  );
};

export default VideoPlayer;
