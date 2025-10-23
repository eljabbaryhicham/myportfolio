
'use client';

import { useEffect, useRef } from 'react';

interface ClapperPlayerProps {
  source: string;
  poster?: string;
  isBackground?: boolean;
}

export default function ClapperPlayer({ source, poster, isBackground = false }: ClapperPlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!playerRef.current) return;

    // Dynamically import the Clappr player only on the client-side
    import('@clappr/player').then(PlayerModule => {
      // The constructor is the default export of the module
      const Player = PlayerModule.default;

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
            // HLS.js configuration can be added here if needed
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
  // Re-run this effect if the source URL changes.
  }, [source, poster, isBackground]);

  // Generate a unique ID for each player instance to avoid conflicts
  const playerId = useRef(`player-${Math.random().toString(36).substring(7)}`).current;

  return <div id={playerId} ref={playerRef} className="w-full h-full"></div>;
}
