
"use client";

import type { PlyrProps, PlyrSource } from "plyr-react";
import Plyr from "plyr-react";
import "plyr-react/plyr.css";
import React, { useEffect, useRef } from "react";
import type PlyrInstance from "plyr";


interface VideoPlayerProps extends PlyrProps {
  source: PlyrSource;
  innerRef?: React.Ref<PlyrInstance>;
  onReady?: (player: PlyrInstance) => void;
}

const VideoPlayer = ({ source, innerRef, onReady }: VideoPlayerProps) => {
  if (!source) return null;

  const qualities = source.sources.map(s => (s as any).size).filter(Boolean);

  const internalRef = useRef<PlyrInstance | null>(null);

  useEffect(() => {
    const player = internalRef.current;
    if (player && onReady) {
      player.on('ready', () => {
        onReady(player);
      });
    }

    // Also handle the case where the component unmounts
    return () => {
      if (player) {
        // Clean up listeners if necessary
        // player.off('ready', ...);
      }
    };
  }, [onReady]);


  const handleRef = (player: PlyrInstance | null) => {
    internalRef.current = player;
    if (typeof innerRef === 'function') {
      innerRef(player);
    } else if (innerRef) {
      (innerRef as React.MutableRefObject<PlyrInstance | null>).current = player;
    }
  };

  return (
    <Plyr
      ref={handleRef}
      source={source}
      options={{
        autoplay: false,
        controls: [
            'play-large', 
            'play', 
            'progress', 
            'current-time', 
            'mute', 
            'volume', 
            'captions', 
            'settings', 
            'pip', 'airplay', 'fullscreen'
        ],
        poster: source.poster,
        previewThumbnails: {
          enabled: true,
          src: 'https://cdn.plyr.io/static/demo/thumbs/100p.vtt'
        },
        quality: {
            default: qualities.length > 0 ? Math.min(...qualities) : 576,
            options: qualities,
        },
        fullscreen: {
          enabled: true,
          fallback: true,
          iosNative: true,
        },
        // Show a spinner while the video is buffering
        spinner: {
          enabled: true,
        }
      }}
    />
  );
};

export default VideoPlayer;
