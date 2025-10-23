'use client';
import { useEffect, useRef } from 'react';

// Define the expected shape of the Player module for TypeScript
interface PlayerModule {
  default: any; // Using 'any' for flexibility with different module export styles
}

interface ClapperPlayerProps {
  source: string;
  poster?: string;
  chromeless?: boolean;
}

// Global counter to ensure unique IDs across all player instances
let playerCounter = 0;

export default function ClapperPlayer({ source, poster, chromeless = false }: ClapperPlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);

  // Generate a unique ID that persists across renders for this specific component instance
  const uniqueIdRef = useRef<string>(`clappr-player-${playerCounter++}`);

  useEffect(() => {
    // Don't run on server
    if (typeof window === 'undefined' || !playerRef.current) return;

    // 1. Destroy any existing player instance to prevent duplicates.
    if (playerInstanceRef.current) {
      playerInstanceRef.current.destroy();
      playerInstanceRef.current = null;
    }

    // 2. Clear any leftover DOM elements from the container. This is a crucial safeguard.
    playerRef.current.innerHTML = '';
    
    // 3. Dynamically import the player library (client-side only).
    import('@clappr/player').then((module) => {
        // Handle both ESM default and CommonJS module exports
        const ClapprConstructor = module.default ? module.default.Player : module.Player;
        
        if (playerRef.current && ClapprConstructor) {
            // 4. Create the new player instance.
            playerInstanceRef.current = new ClapprConstructor({
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
        }
    }).catch(error => {
      console.error("Failed to load Clappr player:", error);
    });

    // 5. Return a cleanup function to destroy the player when the component unmounts.
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
