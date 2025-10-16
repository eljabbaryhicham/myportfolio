
"use client";

import type { PlyrProps, PlyrSource } from "plyr-react";
import Plyr from "plyr-react";
import "plyr-react/plyr.css";
import React from "react";
import type PlyrInstance from "plyr";


interface VideoPlayerProps extends PlyrProps {
  source: PlyrSource;
  innerRef?: React.Ref<PlyrInstance>;
}

const VideoPlayer = ({ source, innerRef }: VideoPlayerProps) => {
  if (!source) return null;

  const qualities = source.sources.map(s => (s as any).size).filter(Boolean);

  return (
    <Plyr
      ref={innerRef}
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
            'pip', 
            'airplay', 
            'fullscreen'
        ],
        previewThumbnails: {
          enabled: true,
          src: 'https://cdn.plyr.io/static/demo/thumbs/100p.vtt'
        },
        quality: {
            default: qualities.length > 0 ? Math.min(...qualities) : 576,
            options: qualities,
        }
      }}
    />
  );
};

export default VideoPlayer;
