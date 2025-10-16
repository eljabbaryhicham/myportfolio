
"use client";

import type { PlyrProps, PlyrSource } from "plyr-react";
import Plyr from "plyr-react";
import "plyr-react/plyr.css";

interface VideoPlayerProps {
  source: PlyrSource;
}

const VideoPlayer = ({ source }: VideoPlayerProps) => {
  if (!source) return null;

  const qualities = source.sources.map(s => (s as any).size).filter(Boolean);

  return (
    <Plyr
      source={source}
      options={{
        autoplay: true,
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
