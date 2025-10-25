
'use client';

import React, { useEffect, useRef } from 'react';
import Plyr from 'plyr-react';
import 'plyr/dist/plyr.css';
import Hls from 'hls.js';

interface PlyrPlayerProps {
  source: string;
  poster?: string;
  watermark?: string;
}

const PlyrPlayer: React.FC<PlyrPlayerProps> = ({ source, poster, watermark }) => {
  const ref = useRef<any>(null);
  const hls = useRef<Hls | null>(null);

  useEffect(() => {
    const videoElement = ref.current?.media;

    if (videoElement) {
      // For HLS (m3u8) streams
      if (source.includes('.m3u8')) {
        if (Hls.isSupported()) {
          hls.current = new Hls();
          hls.current.loadSource(source);
          hls.current.attachMedia(videoElement);
        } else {
          console.error("HLS is not supported in this browser.");
          videoElement.src = source;
        }
      } else {
        // For standard video files like MP4
        videoElement.src = source;
      }
    }

    return () => {
      if (hls.current) {
        hls.current.destroy();
        hls.current = null;
      }
    };
  }, [source]);

  const plyrOptions = {
    controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
    autoplay: true,
    playsinline: true,
    clickToPlay: true,
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
        <Plyr ref={ref} source={plyrSource} options={plyrOptions} />
        {watermark && (
            <div className="plyr__watermark">
                <img src={watermark} alt="Watermark" />
            </div>
        )}
      </div>
    </>
  );
};

export default PlyrPlayer;
