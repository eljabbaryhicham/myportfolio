'use client';
import { useEffect, useRef } from 'react';

// Make Clappr available on the window object for type safety
declare global {
    interface Window {
        Clappr: any;
    }
}

interface CdnClapprPlayerProps {
  source: string;
  poster?: string;
  chromeless?: boolean;
}

// Global counter to ensure unique IDs across all player instances
let playerCounter = 0;

export default function CdnClapprPlayer({ source, poster, chromeless = false }: CdnClapprPlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);

  // Generate a unique ID that persists across renders for this specific component instance
  const uniqueIdRef = useRef<string>(`clappr-player-${playerCounter++}`);

  useEffect(() => {
    // Don't run on server or if Clappr script hasn't loaded yet
    if (typeof window === 'undefined' || !playerRef.current || typeof window.Clappr === 'undefined') {
      return;
    }

    // 1. Destroy any existing player instance to prevent duplicates.
    if (playerInstanceRef.current) {
      playerInstanceRef.current.destroy();
      playerInstanceRef.current = null;
    }

    // 2. Clear any leftover DOM elements from the container. This is a crucial safeguard.
    playerRef.current.innerHTML = '';
    
    // 3. Create the new player instance using the Clappr constructor from the window object.
    playerInstanceRef.current = new window.Clappr.Player({
        source,
        poster,
        parentId: `#${uniqueIdRef.current}`,
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

    // 4. Return a cleanup function to destroy the player when the component unmounts.
    return () => {
      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
        playerInstanceRef.current = null;
      }
    };
  }, [source, poster, chromeless]); // Re-run the effect if these props change.

  // Assign the unique ID to the container div.
  return <div id={uniqueIdRef.current} ref={playerRef} className="w-full h-full" />;
}
