
'use client';

import { useEffect, useRef } from 'react';
import { Player } from '@clappr/player';

interface ClapperPlayerProps {
  source: string;
  poster?: string;
  isBackground?: boolean;
}

export default function ClapperPlayer({ source, poster, isBackground = false }: ClapperPlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!playerRef.current) return;

    const player = new Player({
      source: source,
      poster: poster,
      parentId: `#${playerRef.current.id}`,
      width: '100%',
      height: '100%',
      autoPlay: isBackground,
      mute: isBackground,
      loop: isBackground,
      chromeless: isBackground, // Removes all player controls
      playback: {
        hlsjsConfig: {
          // HLS.js configuration
        },
      },
    });

    return () => {
      player.destroy();
    };
  }, [source, poster, isBackground]);

  return <div id={`player-${Math.random().toString(36).substring(7)}`} ref={playerRef} className="w-full h-full"></div>;
}
