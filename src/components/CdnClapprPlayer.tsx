
'use client';
import { useEffect, useRef, useState } from 'react';
import Preloader from './preloader';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  useEffect(() => {
    loadStylesheet('https://cdn.jsdelivr.net/npm/@clappr/player@latest/dist/clappr.min.css', 'clappr-stylesheet');

    Promise.all([
        loadScript('https://cdn.jsdelivr.net/npm/clappr@latest/dist/clappr.min.js', 'clappr-script'),
        loadScript('https://cdn.jsdelivr.net/gh/clappr/dash-shaka-playback@latest/dist/dash-shaka-playback.js', 'clappr-shaka-playback'),
    ])
    .then(() => setScriptsLoaded(true))
    .catch(error => {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Could not load video player',
        description: 'An essential script for video playback failed to load. Please check your internet connection or ad-blocker.'
      })
    });
  }, [toast]);

  useEffect(() => {
    if (!scriptsLoaded || !playerRef.current) {
      return;
    }

    // Small delay to ensure scripts are fully available on the window object
    const timer = setTimeout(() => {
      // Guard clause to ensure Clappr is initialized
      if (typeof window.Clappr === 'undefined') {
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
          playsInline: true,
          playinline: true, // Explicitly set for maximum iOS compatibility
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
            onReady: () => setIsLoading(false),
            onPlay: () => setIsLoading(false),
            onError: () => setIsLoading(false),
          }
      });
    }, 100); // 100ms delay

    // Cleanup function
    return () => {
      clearTimeout(timer);
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
