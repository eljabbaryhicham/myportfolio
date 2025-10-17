
"use client";

import type { PlyrProps, PlyrSource } from "plyr-react";
import Plyr from "plyr-react";
import "plyr-react/plyr.css";
import React, { useEffect } from "react";
import type PlyrInstance from "plyr";


interface VideoPlayerProps extends PlyrProps {
  source: PlyrSource;
  innerRef?: React.Ref<PlyrInstance>;
  onReady?: (player: PlyrInstance) => void;
}

const VideoPlayer = ({ source, innerRef, onReady }: VideoPlayerProps) => {
  if (!source) return null;

  const qualities = (source.sources || []).map(s => (s as any).size).filter(Boolean);
  
  // This effect will run when the component mounts and the ref is attached.
  useEffect(() => {
    if (innerRef && 'current' in innerRef && innerRef.current && onReady) {
      const player = innerRef.current;
      const handleReady = () => {
        onReady(player);
        // Clean up the event listener after it has fired.
        player.off('ready', handleReady);
      };
      player.on('ready', handleReady);

      // Return a cleanup function for when the component unmounts.
      return () => {
        if (player) {
          player.off('ready', handleReady);
        }
      };
    }
  }, [innerRef, onReady]);


  return (
    <Plyr
      ref={innerRef}
      source={source}
      options={{
        autoplay: false,
        poster: source.poster,
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
