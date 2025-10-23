
'use client';
import { useEffect, useRef } from 'react';

// Make Clappr and its plugins available on the window object for type safety
declare global {
    interface Window {
        Clappr: any;
        DashShakaPlayback: any;
    }
}

interface CdnClapprPlayerProps {
  source: string;
  poster?: string;
  chromeless?: boolean;
}

export default function CdnClapprPlayer({ source, poster, chromeless = false }: CdnClapprPlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Don't run on server or if Clappr script hasn't loaded yet
    if (typeof window === 'undefined' || !playerRef.current || typeof window.Clappr === 'undefined' || typeof window.DashShakaPlayback === 'undefined') {
      return;
    }
    
    // Destroy any existing player instance to prevent duplicates
    if (playerInstanceRef.current) {
      playerInstanceRef.current.destroy();
    }
    
    playerInstanceRef.current = new window.Clappr.Player({
        source,
        poster,
        parentId: `#${playerRef.current.id}`,
        width: '100%',
        height: '100%',
        plugins: [window.DashShakaPlayback],
        shakaConfiguration: {
          // Example configuration, can be extended
          streaming: {
            rebufferingGoal: 15
          }
        },
        shakaOnBeforeLoad: function(shaka_player: any) {
          // shaka_player.getNetworkingEngine().registerRequestFilter() ...
        },
    });

    // Cleanup function to destroy the player when the component unmounts
    return () => {
      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
      }
    };
  }, [source, poster]); // Re-run the effect if these props change

  // Use a static ID or generate one that's consistent across renders
  return <div id="cdn-clappr-player" ref={playerRef} className="w-full h-full" />;
}
