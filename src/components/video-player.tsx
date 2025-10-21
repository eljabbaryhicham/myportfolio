
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
    const isYoutube = firstSource.provider === 'youtube';
    const isVimeo = firstSource.provider === 'vimeo';
    
    // Function to initialize Plyr
    const initPlyr = (options: Plyr.Options = {}) => {
        const newPlayer = new Plyr(videoElement, options);
        playerRef.current = newPlayer;
        if(onReady) {
            newPlayer.on('ready', onReady);
        }
    };

    // --- 2. Setup based on source type ---
    if (isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(firstSource.src);
        hls.attachMedia(videoElement);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          initPlyr();
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
                console.error('HLS.js fatal error:', data.details);
            }
        });

      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (e.g., Safari)
        videoElement.src = firstSource.src;
        videoElement.addEventListener('loadedmetadata', () => {
          initPlyr();
        });
      }
    } else if (isYoutube || isVimeo) {
        // For YouTube/Vimeo, Plyr handles the source directly.
        initPlyr({ source: source as Plyr.SourceInfo });
    }
    else {
      // Standard MP4 source
      videoElement.src = firstSource.src;
      initPlyr();
    }

    // --- 3. Final Cleanup ---
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
  }, [source, onReady]); // Rerun when the source changes

  return (
      <div className="w-full h-full bg-black">
        <video ref={videoRef} className="w-full h-full" poster={poster} playsInline controls />
      </div>
  );
};

export default VideoPlayer;
