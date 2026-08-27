'use client';
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import Preloader from './preloader';
import { useToast } from '@/hooks/use-toast';

// Make Clappr available on the window object for type safety
declare global {
    interface Window {
        Clappr: any;
    }
}

interface CdnClapprPlayerProps {
  source: string;
  poster?: string;
  autoPlay?: boolean;
  watermark?: string;
}

const CdnClapprPlayer = forwardRef(function CdnClapprPlayer({ source, poster, autoPlay = true, watermark }: CdnClapprPlayerProps, ref) {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [containerId] = useState(() => `cdn-clappr-player-${Math.random().toString(36).substring(7)}`);
  
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const initPlayer = async () => {
      const container = playerContainerRef.current;
      if (!container) return;
      setIsLoading(true);

      try {
        await import('@clappr/player');
        if (!isMounted || !window.Clappr) return;
        if (!isMounted || !container) return;

        const newPlayer = new window.Clappr.Player({
            parentId: `#${container.id}`,
            source,
            poster,
            width: '100%',
            height: '100%',
            autoPlay: autoPlay,
            mute: autoPlay,
            volume: 100,
            watermark: watermark || '',
            watermarkLink: undefined,
            clickToToggle: true,
            playback: {
              playInline: true,
            },
            mediacontrol: {
              buttons: ['play', 'volume', 'fullscreen'],
            },
            events: {
              onReady: () => {
                if (isMounted) setIsLoading(false);
              },
              onError: (e: any) => {
                if (isMounted) {
                  setIsLoading(false);
                  console.error("Clappr player error:", e);
                }
              },
            }
        });
        
        playerRef.current = newPlayer;

        // Hide preloader when video actually starts playing (frame presented)
        // Fallback: ready event already hides it
        try {
          newPlayer.on(window.Clappr.Events.PLAYER_PLAY, () => {
            if (isMounted) setIsLoading(false);
          });
        } catch {}

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
      const player = playerRef.current;
      if (player) {
        try {
           player.stop();
           player.destroy();
        } catch (e) {
          console.error("Error destroying Clappr player:", e);
        }
      }
      playerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]); 

  useImperativeHandle(ref, () => ({ isLoading }), [isLoading]);

  return (
    <div className="absolute inset-0 bg-black">
      <div
        id={containerId}
        ref={playerContainerRef}
        className="w-full h-full"
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
          <Preloader />
        </div>
      )}
    </div>
  );
});

CdnClapprPlayer.displayName = 'CdnClapprPlayer';
export default CdnClapprPlayer;
