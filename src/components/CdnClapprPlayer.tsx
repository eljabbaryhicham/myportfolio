
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
        LevelSelector: any;
    }
}

interface CdnClapprPlayerProps {
  source: string;
  poster?: string;
  autoPlay?: boolean;
  playerRef?: React.MutableRefObject<any | null>;
  watermark?: string;
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
    script.onerror = (e) => reject(new Error(`Failed to load script: ${src}. Error: ${e}`));
    document.head.appendChild(script);
  });
};

export default function CdnClapprPlayer({ source, poster, autoPlay = true, playerRef: parentPlayerRef, watermark }: CdnClapprPlayerProps) {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const internalPlayerRef = useRef<any>(null);
  const playerRef = parentPlayerRef || internalPlayerRef;
  
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    let player: any = null;

    const initPlayer = async () => {
      if (!playerContainerRef.current) return;

      try {
        // Step 1: Load the core Clappr player script first.
        await loadScript('https://cdn.jsdelivr.net/npm/@clappr/player@latest/dist/clappr.min.js', 'clappr-script');

        if (!isMounted) return;

        // Step 2: Load all plugin scripts in parallel now that core is loaded.
        await Promise.all([
            loadScript('https://cdn.jsdelivr.net/gh/clappr/dash-shaka-playback@latest/dist/dash-shaka-playback.js', 'clappr-shaka-playback'),
            loadScript('https://cdn.jsdelivr.net/npm/clappr-level-selector-plugin@latest/dist/level-selector.min.js', 'clappr-level-selector'),
        ]);

        if (!isMounted || !playerContainerRef.current) return;
        
        // Step 3: Initialize Player now that all scripts are loaded
        const plugins = [];
        if (window.DashShakaPlayback) {
          plugins.push(window.DashShakaPlayback);
        }
        if (window.LevelSelector) {
          plugins.push(window.LevelSelector);
        }

        player = new window.Clappr.Player({
            source,
            poster,
            parentId: `#${playerContainerRef.current.id}`,
            width: '100%',
            height: '100%',
            autoPlay: autoPlay,
            watermark: watermark || '',
            watermarkLink: undefined,
            playsInline: true,
            playinline: true,
            volume: 20,
            plugins: plugins,
            shakaConfiguration: {
              streaming: {
                rebufferingGoal: 15
              }
            },
            mediacontrol: {
              seekbar: "hsl(347 86% 52%)",
              buttons: "#FFFFFF"
            },
            levelSelectorConfig: {
              title: 'Quality',
              labels: {
                  2: 'High', // 1080p
                  1: 'Med', // 720p
                  0: 'Low', // 360p
              },
            },
            events: {
              onReady: () => setIsLoading(false),
              onPlay: () => setIsLoading(false),
              onError: () => setIsLoading(false),
            }
        });
        
        if (playerRef) {
          playerRef.current = player;
        }

      } catch (error: any) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Could not load video player',
          description: error.message || 'An essential script for video playback failed to load. Please check your internet connection or ad-blocker.'
        });
        setIsLoading(false);
      }
    };
    
    initPlayer();

    return () => {
      isMounted = false;
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]); // Rerun only when the source changes

  return (
    <div className="w-full h-full relative bg-black">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
            <Preloader />
        </div>
      )}
      <div 
        id={`cdn-clappr-player-${Math.random().toString(36).substring(7)}`}
        ref={playerContainerRef} 
        className={cn("w-full h-full transition-opacity duration-300", isLoading ? 'opacity-0' : 'opacity-100')} 
      />
    </div>
  );
}
