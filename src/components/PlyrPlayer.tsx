
'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Plyr from 'plyr-react';
import 'plyr/dist/plyr.css';
import Hls from 'hls.js';

interface PlyrPlayerProps {
  source: string;
  poster?: string;
  watermark?: string;
  playerRef: React.MutableRefObject<any>;
}

const PlyrPlayer = ({ source, poster, watermark, playerRef }: PlyrPlayerProps) => {
  const hls = useRef<Hls | null>(null);

  useEffect(() => {
    const player = playerRef.current?.plyr;
    const videoElement = playerRef.current?.media;

    if (!player || !videoElement) return;

    // Update source when it changes
    const newSource = {
        type: 'video' as 'video',
        poster: poster,
        sources: [{ src: source, type: source.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4' }],
    };

    // Use HLS.js for HLS streams
    if (source.includes('.m3u8')) {
        if (Hls.isSupported()) {
            if (hls.current) {
                hls.current.destroy();
            }
            const newHls = new Hls();
            hls.current = newHls;
            newHls.loadSource(source);
            newHls.attachMedia(videoElement);
            player.source = newSource;
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            videoElement.src = source;
        }
    } else {
        player.source = newSource;
    }
  }, [source, poster, playerRef]);

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
        <Plyr ref={playerRef} source={plyrSource} options={plyrOptions} />
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

    