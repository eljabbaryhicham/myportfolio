
'use client';

import React, { useEffect, useRef } from 'react';
import DPlayer from 'dplayer';

interface H5PlayerProps {
  source: string;
}

const H5Player: React.FC<H5PlayerProps> = ({ source }) => {
  const playerRef = useRef<HTMLDivElement>(null);
  const dpInstanceRef = useRef<DPlayer | null>(null);

  useEffect(() => {
    // This effect runs only on the client side
    if (playerRef.current && !dpInstanceRef.current) {
      dpInstanceRef.current = new DPlayer({
        container: playerRef.current,
        video: {
          url: source,
          pic: 'https://picsum.photos/seed/liquid5/800/450', // Poster image
        },
        autoplay: true,
        loop: true,
        muted: true,
        controls: false,
      });
    }

    // Cleanup function to destroy the player instance when the component unmounts
    return () => {
      if (dpInstanceRef.current) {
        dpInstanceRef.current.destroy();
        dpInstanceRef.current = null;
      }
    };
  }, [source]); // Re-run the effect if the source changes

  return <div ref={playerRef} className="w-full h-full" />;
};

export default H5Player;
