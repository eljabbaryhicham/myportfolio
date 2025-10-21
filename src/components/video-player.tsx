
'use client';

import React, { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  source: {
    type: 'video';
    sources: { src: string }[];
  };
  poster?: string;
  onReady?: () => void;
}

/**
 * A simple HTML5 video player component.
 * It renders a standard <video> tag and is ready to be enhanced with a more robust player library.
 */
const VideoPlayer: React.FC<VideoPlayerProps> = ({ source, poster, onReady }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
        // When the component is ready, we can call the onReady callback if provided.
        onReady?.();
    }
  }, [onReady]);

  const videoSource = source.sources[0]?.src;

  return (
    <div className="w-full h-full bg-black">
      {videoSource ? (
         <video
            ref={videoRef}
            src={videoSource}
            poster={poster}
            controls
            playsInline
            className="w-full h-full object-contain"
         />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/50">
            <p>Video source not available.</p>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
