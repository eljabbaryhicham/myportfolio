"use client";

import type { PlyrProps } from "plyr-react";
import Plyr from "plyr-react";
import "plyr-react/plyr.css";

interface VideoPlayerProps {
  source: PlyrProps["source"];
}

const VideoPlayer = ({ source }: VideoPlayerProps) => {
  if (!source) return null;

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
      }}
    />
  );
};

export default VideoPlayer;
