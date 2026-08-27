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
        const mod: any = await import('@clappr/player');
        const Clappr = mod?.default || mod?.Clappr || (window as any).Clappr;
        if (!isMounted || !Clappr) {
          console.error('Clappr failed to load: module did not expose Clappr');
          if (isMounted) setIsLoading(false);
          return;
        }
        if (!isMounted || !container) return;

        const newPlayer = new Clappr.Player({
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
              seekbar: "hsl(var(--primary))",
              buttons: ['play', 'volume', 'fullscreen'],
            },
            events: {
              onReady: () => {
                // For click-to-play (autoPlay false) hide preloader once ready so poster shows.
                // For autoplay, keep preloader until video actually starts playing to avoid
                // showing controls over black frame — preloader and controls overlapping.
                if (isMounted && !autoPlay) setIsLoading(false);
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

        // Hide preloader only when video frame is presented (playing), not onReady.
        // This prevents preloader + controls appearing together over black screen.
        const hideOnPlay = () => { if (isMounted) setIsLoading(false); };
        try {
          newPlayer.on(Clappr.Events.PLAYER_PLAY, hideOnPlay);
          // Fallback for HTML5 playback where PLAYER_PLAY may not fire before first frame
          newPlayer.on(Clappr.Events.PLAYBACK_PLAY, hideOnPlay);
        } catch {}
        // Safety fallback if playing never fires (autoplay blocked or error)
        setTimeout(() => { if (isMounted) setIsLoading(false); }, 8000);

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
  }, [source]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    try {
      if (autoPlay) {
        // Try to play if autoPlay became true (e.g., dialog closed)
        if (typeof player.play === 'function' && !player.isPlaying?.()) player.play();
      } else {
        if (typeof player.pause === 'function') player.pause();
      }
    } catch {}
  }, [autoPlay]);

  useImperativeHandle(ref, () => ({ isLoading }), [isLoading]);

  return (
    <div className="absolute inset-0 bg-black">
      <div
        id={containerId}
        ref={playerContainerRef}
        className="w-full h-full"
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black pointer-events-none z-10">
          <Preloader />
        </div>
      )}
    </div>
  );
});

CdnClapprPlayer.displayName = 'CdnClapprPlayer';
export default CdnClapprPlayer;
