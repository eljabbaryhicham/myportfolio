'use client';
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import Preloader from './preloader';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { forceAutoplay } from '@/lib/video-autoplay';

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

  // Latch: hide preloader the moment playback starts; never re-show on
  // later loadstart/buffering.
  const [hasPlayed, setHasPlayed] = useState(false);
  const wasPlayingBeforePauseRef = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const initPlayer = async () => {
      const container = playerContainerRef.current;
      if (!container) return;
      setHasPlayed(false);

      try {
        const mod: any = await import('@clappr/player');
        const Clappr = mod?.default || mod?.Clappr || (window as any).Clappr;
        if (!isMounted || !Clappr) {
          logger.error('Clappr failed to load: module did not expose Clappr');
          if (isMounted) setHasPlayed(true);
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
            watermark: '',
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
                if (isMounted && !autoPlay) setHasPlayed(true);
              },
              onError: (e: any) => {
                if (isMounted) {
                  setHasPlayed(true);
                  logger.error("Clappr player error:", e);
                }
              },
            }
        });

        playerRef.current = newPlayer;

        // Hide preloader only when video frame is presented (playing), not onReady.
        // This prevents preloader + controls appearing together over black screen.
        // Autoplay must start muted (browser policy) then unmute for sound.
        const hideOnPlay = () => {
          if (isMounted) setHasPlayed(true);
          if (autoPlay) {
            try { newPlayer.setVolume(100); } catch {}
            try {
              const v = container.querySelector('video') as HTMLVideoElement | null;
              if (v) { v.muted = false; v.removeAttribute('muted'); }
            } catch {}
          }
        };
        // Ensure reliable autoplay on mobile via forceAutoplay (muted+playsinline+retry)
        const videoEl = container.querySelector('video') as HTMLVideoElement | null;
        if (videoEl) {
          videoEl.setAttribute('playsinline', '');
          videoEl.setAttribute('webkit-playsinline', '');
          if (autoPlay) {
            try { forceAutoplay(videoEl, { onPlaying: hideOnPlay }); } catch {}
          }
          videoEl.addEventListener('playing', hideOnPlay, { once: true });
        } else if (autoPlay) {
          // Clappr may inject video async — poll briefly
          let attempts = 0;
          const poll = setInterval(() => {
            attempts++;
            const v = container.querySelector('video') as HTMLVideoElement | null;
            if (v) {
              clearInterval(poll);
              v.setAttribute('playsinline', '');
              v.setAttribute('webkit-playsinline', '');
              try { forceAutoplay(v, { onPlaying: hideOnPlay }); } catch {}
              v.addEventListener('playing', hideOnPlay, { once: true });
            }
            if (attempts > 10) clearInterval(poll);
          }, 200);
        }
        try {
          newPlayer.on(Clappr.Events.PLAYER_PLAY, hideOnPlay);
          // Fallback for HTML5 playback where PLAYER_PLAY may not fire before first frame
          newPlayer.on(Clappr.Events.PLAYBACK_PLAY, hideOnPlay);
        } catch {}
        // Safety fallback if playing never fires (autoplay blocked or error)
        setTimeout(() => { if (isMounted) setHasPlayed(true); }, 8000);

      } catch (error: any) {
        logger.error(error);
        if (isMounted) {
          toast({
            variant: 'destructive',
            title: 'Could not load video player',
            description: error.message || 'An essential script for video playback failed to load. Please check your internet connection or ad-blocker.',
            duration: 9000,
          });
          setHasPlayed(true);
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
          logger.error("Error destroying Clappr player:", e);
        }
      }
      playerRef.current = null;
    };
  }, [source, autoPlay, poster, toast]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    try {
      if (autoPlay) {
        if (wasPlayingBeforePauseRef.current && typeof player.play === 'function' && !player.isPlaying?.()) player.play();
        wasPlayingBeforePauseRef.current = false;
      } else {
        wasPlayingBeforePauseRef.current = typeof player.isPlaying === 'function' ? !!player.isPlaying() : false;
        if (typeof player.pause === 'function') player.pause();
      }
    } catch {}
  }, [autoPlay]);

  useImperativeHandle(ref, () => ({
    isLoading: !hasPlayed,
    pause: () => {
      try {
        const p = playerRef.current;
        if (p && typeof p.pause === 'function') p.pause();
      } catch {}
    },
    play: () => {
      try {
        const p = playerRef.current;
        if (p && typeof p.play === 'function') p.play();
      } catch {}
    },
    isPlaying: () => {
      try {
        const p = playerRef.current;
        if (p && typeof p.isPlaying === 'function') return !!p.isPlaying();
      } catch {}
      return false;
    },
  }), [hasPlayed]);

  return (
    <div className="absolute inset-0 bg-black">
      <div
        id={containerId}
        ref={playerContainerRef}
        className="w-full h-full"
      />
      {!hasPlayed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black pointer-events-none z-10">
          <Preloader />
        </div>
      )}
    </div>
  );
});

CdnClapprPlayer.displayName = 'CdnClapprPlayer';
export default CdnClapprPlayer;
