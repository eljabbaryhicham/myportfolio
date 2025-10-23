
'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ClapperPlayerProps {
  source: string;
  poster?: string;
  chromeless?: boolean; // To hide all controls
}

const ClapperPlayer = ({ source, poster, chromeless = false }: ClapperPlayerProps) => {
  const playerRef = useRef<HTMLDivElement>(null);
  const clapprInstanceRef = useRef<any>(null);

  useEffect(() => {
    const initPlayer = async () => {
      if (playerRef.current && source) {
        // Dynamically import Clappr and its HLS plugin only on the client-side
        const Clappr = (await import('clappr')).default;
        const HlsjsPlayback = (await import('@clappr/hlsjs-playback')).default;

        // Destroy any existing instance before creating a new one
        if (clapprInstanceRef.current) {
          clapprInstanceRef.current.destroy();
        }

        const player = new Clappr.Player({
          source: source,
          poster: poster,
          parentId: `#${playerRef.current.id}`,
          plugins: [HlsjsPlayback],
          width: '100%',
          height: '100%',
          autoPlay: chromeless, // Autoplay only if it's a chromeless background video
          mute: chromeless, // Mute if it's a background video
          loop: chromeless,
          hideMediaControl: chromeless, // Hides default media control
          chromeless: chromeless, // Official chromeless option
          playback: {
            hlsjsConfig: {
              // hls.js specific options
            },
          },
        });

        clapprInstanceRef.current = player;
      }
    };

    initPlayer();

    // Cleanup function to destroy the player instance when the component unmounts
    return () => {
      if (clapprInstanceRef.current) {
        clapprInstanceRef.current.destroy();
        clapprInstanceRef.current = null;
      }
    };
  }, [source, poster, chromeless]); // Re-initialize if the source, poster or chromeless prop changes

  return (
    <div
      id={`clappr-player-${Math.random().toString(36).substr(2, 9)}`}
      ref={playerRef}
      className={cn('w-full h-full', chromeless && 'shaka-spinner')}
    />
  );
};

ClapperPlayer.displayName = 'ClapperPlayer';

export default ClapperPlayer;
