
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

export default function CdnClapprPlayer({ source, poster, autoPlay = true, playerRef: parentPlayerRef }: CdnClapprPlayerProps) {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const internalPlayerRef = useRef<any>(null);
  const playerRef = parentPlayerRef || internalPlayerRef;
  
  const [isLoading, setIsLoading] = useState(true);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
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
    if (!scriptsLoaded || !playerContainerRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      if (typeof window.Clappr === 'undefined') {
        return;
      }
      
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      
      const plugins = [];
      if (window.DashShakaPlayback) {
        plugins.push(window.DashShakaPlayback);
      }
      if (window.Clappr.LevelSelector) {
        plugins.push(window.Clappr.LevelSelector);
      }

      const player = new window.Clappr.Player({
          source,
          poster,
          parentId: `#${playerContainerRef.current.id}`,
          width: '100%',
          height: '100%',
          autoPlay: autoPlay,
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
          shakaOnBeforeLoad: function(shaka_player: any) {},
          events: {
            onReady: () => setIsLoading(false),
            onPlay: () => setIsLoading(false),
            onError: () => setIsLoading(false),
          }
      });
      
      playerRef.current = player;

    }, 100);

    return () => {
      clearTimeout(timer);
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [source, poster, autoPlay, scriptsLoaded, playerRef]); 

  return (
    <div className="w-full h-full relative bg-black">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
            <Preloader />
        </div>
      )}
      <div 
        id="cdn-clappr-player" 
        ref={playerContainerRef} 
        className={cn("w-full h-full transition-opacity duration-300", isLoading ? 'opacity-0' : 'opacity-100')} 
      />
    </div>
  );
}
