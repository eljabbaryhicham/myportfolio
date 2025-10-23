
'use client';

import { useEffect, useRef } from 'react';
// Do not import Player from '@clappr/player' directly at the top level

interface ClapperPlayerProps {
  source: string;
  poster?: string;
  isBackground?: boolean;
}

export default function ClapperPlayer({ source, poster, isBackground = false }: ClapperPlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null); // To hold the player instance

  useEffect(() => {
    if (!playerRef.current) return;

    // Dynamically import the Player class inside useEffect
    import('@clappr/player').then((PlayerModule) => {
      // The module might be the constructor directly, or it might be on a .default property.
      // This handles both cases.
      const Player = (PlayerModule as any).default || PlayerModule;

      // Ensure we don't create duplicate players
      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
      }

      const player = new Player({
        source: source,
        poster: poster,
        parentId: `#${playerRef.current!.id}`,
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
      
      playerInstanceRef.current = player;
    });

    // Cleanup function to destroy the player instance when the component unmounts
    return () => {
      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
        playerInstanceRef.current = null;
      }
    };
  // We only want to re-run this effect if the source URL changes.
  }, [source, poster, isBackground]);

  // Generate a unique ID for each player instance to avoid conflicts
  const playerId = useRef(`player-${Math.random().toString(36).substring(7)}`).current;

  return <div id={playerId} ref={playerRef} className="w-full h-full"></div>;
}
