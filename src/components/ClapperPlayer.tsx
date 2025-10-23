
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
    let player: any = null;

    if (playerRef.current) {
      // Dynamically import the Clappr player only on the client-side
      import('@clappr/player').then((PlayerModule: unknown) => {
        // Correctly access the default export
        const ClapprPlayer = (PlayerModule as PlayerModule).default;

        if (ClapprPlayer && playerRef.current) {
          player = new ClapprPlayer({
            source: source,
            poster: poster,
            parentId: `#${playerRef.current.id}`,
            width: '100%',
            height: '100%',
            autoPlay: chromeless, // Autoplay only for chromeless
            mute: chromeless, // Mute only for chromeless
            loop: chromeless, // Loop only for chromeless
            chromeless: chromeless, // No controls for background video
            playback: {
              playInline: true,
            },
          });
        }
      });
    }

    // Cleanup on unmount
    return () => {
      if (player) {
        player.destroy();
      }
    };
  }, [source, poster, chromeless]);

  return <div id={playerId} ref={playerRef} className="w-full h-full" />;
}
