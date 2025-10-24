
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
        PlaybackRate: any;
    }
}

interface CdnClapprPlayerProps {
  source: string;
  poster?: string;
  autoPlay?: boolean;
  playerRef?: React.MutableRefObject<any | null>;
  watermark?: string;
}

const loadScript = (src: string, id: string, globalVar: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      const checkVar = () => {
        if ((window as any)[globalVar]) {
          resolve();
        } else {
          setTimeout(checkVar, 100);
        }
      };
      checkVar();
      return;
    }

    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;

    script.onload = () => {
      const checkVar = () => {
        if ((window as any)[globalVar]) {
          resolve();
        } else {
          setTimeout(checkVar, 100);
        }
      };
      checkVar();
    };

    script.onerror = (e) => reject(new Error(`Failed to load script: ${src}.`));
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
      setIsLoading(true);

      try {
        await loadScript('https://cdn.jsdelivr.net/npm/@clappr/player@latest/dist/clappr.min.js', 'clappr-script', 'Clappr');
        
        if (!isMounted) return;

        await Promise.all([
            loadScript('https://cdn.jsdelivr.net/gh/clappr/dash-shaka-playback@latest/dist/dash-shaka-playback.js', 'clappr-shaka-playback', 'DashShakaPlayback'),
            loadScript('https://cdn.jsdelivr.net/gh/clappr/clappr-level-selector-plugin@latest/dist/level-selector.min.js', 'clappr-level-selector', 'LevelSelector'),
            loadScript('https://cdn.jsdelivr.net/npm/clappr-playback-rate-plugin@latest/dist/clappr-playback-rate-plugin.min.js', 'clappr-playback-rate', 'PlaybackRate'),
        ]);

        if (!isMounted || !playerContainerRef.current) return;
        
        const plugins = [];
        if (window.DashShakaPlayback) plugins.push(window.DashShakaPlayback);
        if (window.LevelSelector) plugins.push(window.LevelSelector);
        if (window.PlaybackRate) plugins.push(window.PlaybackRate);

        player = new window.Clappr.Player({
            parentId: `#${playerContainerRef.current.id}`,
            source,
            poster,
            width: '100%',
            height: '100%',
            autoPlay: autoPlay,
            watermark: watermark || '',
            watermarkLink: undefined,
            playsInline: true,
            volume: 20,
            plugins: plugins,
            shakaConfiguration: {
              streaming: {
                rebufferingGoal: 15
              }
            },
            mediacontrol: {
              seekbar: "hsl(var(--destructive))",
              buttons: ['play', 'volume', 'pip', 'fullscreen']
            },
            levelSelectorConfig: {
              title: 'Quality',
              labels: {
                  2: 'High', // e.g., 1080p
                  1: 'Med', // e.g., 720p
                  0: 'Low', // e.g., 360p
              },
            },
            playbackRateConfig: {
                defaultRate: 1.0,
                rates: [0.5, 1.0, 1.5, 2.0]
            },
            events: {
              onReady: () => isMounted && setIsLoading(false),
              onPlay: () => isMounted && setIsLoading(false),
              onError: (e: any) => {
                if (isMounted) {
                  setIsLoading(false);
                  console.error("Clappr player error:", e);
                }
              },
            }
        });
        
        if (playerRef) {
          playerRef.current = player;
        }

      } catch (error: any) {
        console.error(error);
        if (isMounted) {
          toast({
            variant: 'destructive',
            title: 'Could not load video player',
            description: error.message || 'An essential script for video playback failed to load. Please check your internet connection or ad-blocker.',
            duration: 9000,
          });
          setIsLoading(false);
        }
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
  }, [source]); 

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
