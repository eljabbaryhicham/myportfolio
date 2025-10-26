
'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Plyr from 'plyr-react';
import 'plyr/dist/plyr.css';
import Hls from 'hls.js';

interface PlyrPlayerProps {
  source: string;
  poster?: string;
  watermark?: string;
  autoPlay?: boolean;
}

const PlyrPlayer = forwardRef(({ source, poster, watermark, autoPlay = true }: PlyrPlayerProps, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const plyrRef = useRef<any>(null);

  useImperativeHandle(ref, () => plyrRef.current, []);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    let hls: Hls | null = null;
    if (source.includes('.m3u8')) {
        if (Hls.isSupported()) {
            hls = new Hls();
            hls.loadSource(source);
            hls.attachMedia(videoElement);
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            videoElement.src = source;
        }
    } else {
        videoElement.src = source;
    }

    // Effect to control playback based on autoPlay prop
    const playerInstance = plyrRef.current?.plyr;
    if (playerInstance) {
        if (autoPlay) {
            playerInstance.play();
        } else {
            playerInstance.pause();
        }
    }


    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [source, autoPlay]);
  
  const plyrOptions = {
    controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'pip', 'fullscreen'],
    autoplay: autoPlay,
    playsinline: true,
    clickToPlay: true,
    settings: ['quality', 'speed'],
    fullscreen: {
      enabled: true,
      fallback: true,
      iosNative: false,
      container: 'body', // Use the body as the fullscreen container
    },
  };
  
  const plyrSource = {
    type: 'video' as 'video',
    poster: poster,
    sources: [{ src: source, type: source.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4' }],
  };

  return (
    <>
      <style>
        {`
          :root {
            --plyr-color-main: hsl(var(--destructive));
            --plyr-control-radius: 8px;
            --plyr-font-family: 'Quicksand', sans-serif;
          }
          .plyr {
            width: 100%;
            height: 100%;
          }
          .plyr--video .plyr__controls {
            background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
          }
          .plyr__control--overlaid {
            background: rgba(0,0,0,0.6);
            border-radius: 50%;
          }
          .plyr__control:hover {
            background: hsl(var(--destructive));
          }
          .plyr--full-ui.plyr--video .plyr__control--overlaid {
            display: none; // Hide central play button when controls are visible
          }
           .plyr__watermark {
            position: absolute;
            top: 15px;
            right: 15px;
            width: 8%;
            height: auto;
            filter: brightness(0) invert(1);
            opacity: 0.1;
            transition: opacity 0.3s;
            z-index: 10;
          }
          .plyr__watermark:hover {
            opacity: 0.5;
          }
        `}
      </style>
      <div className="relative w-full h-full">
        <Plyr ref={plyrRef} source={plyrSource} options={plyrOptions} />
        {watermark && (
            <div className="plyr__watermark">
                <img src={watermark} alt="Watermark" />
            </div>
        )}
      </div>
    </>
  );
});

PlyrPlayer.displayName = 'PlyrPlayer';
export default PlyrPlayer;
