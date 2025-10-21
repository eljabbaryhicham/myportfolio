
'use client';

import React, { useEffect, useRef } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import Hls from 'hls.js';
import type { Plyr as PlyrType, PlyrSource } from 'plyr';

interface VideoPlayerProps {
  source: PlyrSource | null;
  poster?: string;
  onReady?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ source, poster, onReady }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<PlyrType | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !source) {
      return;
    }

    // --- 1. Cleanup previous instances ---
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    
    let videoSrc = source.sources[0].src;
    let isHls = videoSrc.includes('.m3u8');
    const isCloudinary = videoSrc.includes('res.cloudinary.com');

    // --- 2. Transform Cloudinary URL to HLS ---
    if (isCloudinary && !isHls && source.sources[0].provider !== 'youtube' && source.sources[0].provider !== 'vimeo') {
        const parts = videoSrc.split('/upload/');
        if (parts.length === 2) {
            videoSrc = `${parts[0]}/upload/f_hls/${parts[1].replace(/\.[^/.]+$/, "")}/master.m3u8`;
            isHls = true;
        }
    }

    // Function to initialize Plyr
    const initPlyr = (options: Plyr.Options = {}) => {
      // Ensure no double initialization
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      const newPlayer = new Plyr(videoElement, {
        ...options,
        ...(!isHls && { source: source as Plyr.SourceInfo }), // Provide full source for non-HLS
      });
      playerRef.current = newPlayer;
      if (onReady) {
        newPlayer.on('ready', onReady);
      }
    };

    // --- 3. Setup based on source type ---
    if (isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(videoSrc);
        hls.attachMedia(videoElement);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          initPlyr(); // Initialize Plyr AFTER manifest is parsed
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.error('HLS.js fatal error:', data.details);
          }
        });
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (e.g., Safari)
        videoElement.src = videoSrc;
        videoElement.addEventListener('loadedmetadata', () => {
          initPlyr();
        });
      }
    } else {
      // For standard MP4, YouTube, or Vimeo
      initPlyr();
    }

    // --- 4. Final Cleanup ---
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
    <div className="w-full h-full bg-black plyr__video-embed">
        <video ref={videoRef} className="w-full h-full" poster={poster} playsInline controls />
    </div>
  );
};

export default VideoPlayer;
