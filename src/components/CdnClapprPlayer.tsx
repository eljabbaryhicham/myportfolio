
'use client';
import { useEffect, useRef, useState } from 'react';
import Preloader from './preloader';
import { cn } from '@/lib/utils';

// Make Clappr and its plugins available on the window object for type safety
declare global {
    interface Window {
        Clappr: any;
        DashShakaPlayback: any;
        HlsjsPlayback: any;
    }
}

interface CdnClapprPlayerProps {
  source: string;
  poster?: string;
  autoPlay?: boolean;
}

const loadScript = (src: string, id: string) => {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
};

const loadStylesheet = (href: string, id: string) => {
  if (document.getElementById(id)) {
    return;
  }
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
};


export default function CdnClapprPlayer({ source, poster, autoPlay = true }: CdnClapprPlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  useEffect(() => {
    loadStylesheet('https://cdn.jsdelivr.net/npm/@clappr/player@latest/dist/clappr.min.css', 'clappr-stylesheet');

    Promise.all([
      loadScript('https://cdn.jsdelivr.net/npm/clappr@latest/dist/clappr.min.js', 'clappr-script'),
    ]).then(() => {
        return Promise.all([
            loadScript('https://cdn.jsdelivr.net/npm/clappr-pip-plugin@latest/dist/clappr-pip-plugin.js', 'clappr-pip-plugin'),
            loadScript('https://cdn.jsdelivr.net/npm/clappr-hlsjs-playback@latest/dist/hlsjs-playback.min.js', 'clappr-hls-playback'),
            loadScript('https://cdn.jsdelivr.net/gh/clappr/dash-shaka-playback@latest/dist/dash-shaka-playback.js', 'clappr-shaka-playback'),
        ]);
    })
    .then(() => setScriptsLoaded(true))
    .catch(error => console.error(error));
  }, []);

  useEffect(() => {
    // Don't run on server or if Clappr script hasn't loaded yet
    if (!scriptsLoaded || !playerRef.current || typeof window.Clappr === 'undefined') {
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

    playerInstanceRef.current = new window.Clappr.Player({
        source,
        poster,
        parentId: `#${playerRef.current.id}`,
        width: '100%',
        height: '100%',
        autoPlay: autoPlay,
        volume: 20,
        plugins: plugins,
        clapprColors: {
            main: '#e61e53', // Red theme for the player
        },
        shakaConfiguration: {
          streaming: {
            rebufferingGoal: 15
          }
        },
        shakaOnBeforeLoad: function(shaka_player: any) {
          // shaka_player.getNetworkingEngine().registerRequestFilter() ...
        },
        events: {
          onPlay: () => setIsLoading(false),
          onError: () => setIsLoading(false),
        }
    });

    // Cleanup function to destroy the player when the component unmounts
    return () => {
      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
      }
    };
  }, [source, poster, autoPlay, scriptsLoaded]); // Re-run the effect if these props change

  // Use a static ID or generate one that's consistent across renders
  return (
    <div className="w-full h-full relative bg-black">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
            <Preloader />
        </div>
      )}
      <div 
        id="cdn-clappr-player" 
        ref={playerRef} 
        className={cn("w-full h-full transition-opacity duration-300", isLoading ? 'opacity-0' : 'opacity-100')} 
      />
    </div>
  );
}
