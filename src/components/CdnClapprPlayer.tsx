
'use client';
import { useEffect, useRef } from 'react';

// Make Clappr and its plugins available on the window object for type safety
declare global {
    interface Window {
        Clappr: any;
        DashShakaPlayback: any;
        HlsjsPlayback: any;
        PipPlugin: any;
    }
}

interface CdnClapprPlayerProps {
  source: string;
  poster?: string;
  autoPlay?: boolean;
}

export default function CdnClapprPlayer({ source, poster, autoPlay = true }: CdnClapprPlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Don't run on server or if Clappr script hasn't loaded yet
    if (typeof window === 'undefined' || !playerRef.current || typeof window.Clappr === 'undefined') {
      return;
    }
    
    // Destroy any existing player instance to prevent duplicates
    if (playerInstanceRef.current) {
      playerInstanceRef.current.destroy();
    }
    
    const plugins = [];
    if (window.DashShakaPlayback) {
      plugins.push(window.DashShakaPlayback);
    }
    if (window.HlsjsPlayback) {
      plugins.push(window.HlsjsPlayback);
    }
    if(window.PipPlugin) {
      plugins.push(window.PipPlugin);
    }

    playerInstanceRef.current = new window.Clappr.Player({
        source,
        poster,
        parentId: `#${playerRef.current.id}`,
        width: '100%',
        height: '100%',
        autoPlay: autoPlay,
        volume: 20, // Set volume to 20%
        plugins: plugins,
        shakaConfiguration: {
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
  }, [source, poster, autoPlay]); // Re-run the effect if these props change

  // Use a static ID or generate one that's consistent across renders
  return <div id="cdn-clappr-player" ref={playerRef} className="w-full h-full" />;
}
