
'use client';

import React, { useEffect, useRef } from 'react';
import { H5Player } from 'h5player';
import 'h5player/dist/H5Player.min.css';

interface H5PlayerProps {
  source: string;
}

const H5PlayerComponent: React.FC<H5PlayerProps> = ({ source }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<H5Player | null>(null);

  useEffect(() => {
    // This effect runs only on the client side
    if (containerRef.current) {
      // Initialize the player
      playerRef.current = new H5Player({
        container: containerRef.current,
        source: source,
        muted: true,
        autoplay: true,
        loop: true,
        controls: false,
        ratio: '16:9'
      });
    }

    // Cleanup function to destroy the player instance
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [source]); // Re-run the effect if the source changes

  return <div ref={containerRef} className="w-full h-full" />;
};

export default H5PlayerComponent;
