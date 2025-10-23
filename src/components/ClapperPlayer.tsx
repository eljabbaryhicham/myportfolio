'use client';

import { useEffect, useRef } from 'react';

// Define the expected shape of the Player module for TypeScript
interface PlayerModule {
  default: new (options: any) => any;
}

interface ClapperPlayerProps {
  source: string;
  poster?: string;
  chromeless?: boolean;
}

export default function ClapperPlayer({ source, poster, chromeless = false }: ClapperPlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerId = useRef(`clappr-player-${Math.random().toString(36).substr(2, 9)}`).current;

  useEffect(() => {
    if (typeof window === 'undefined' || !playerRef.current) return;

    let playerInstance: any;

    // Dynamically import the real Clappr module (client-side only)
    import('@clappr/player').then((module) => {
      // The default export *is* the player constructor
      const Clappr = module.default;

      if (playerRef.current) {
        // Create player instance correctly
        playerInstance = new Clappr({
          source,
          poster,
          parentId: `#${playerRef.current.id}`,
          width: '100%',
          height: '100%',
          autoPlay: chromeless,
          mute: chromeless,
          loop: chromeless,
          chromeless: chromeless,
          playback: {
            playInline: true,
          },
        });
      }
    });

    // Clean up player when component unmounts
    return () => {
      if (playerInstance && typeof playerInstance.destroy === 'function') {
        playerInstance.destroy();
      }
    };
  }, [source, poster, chromeless]);

  return <div id={playerId} ref={playerRef} className="w-full h-full" />;
}
