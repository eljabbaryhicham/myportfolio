
'use client';
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import Preloader from './preloader';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const autoplayDisposer = useRef<(() => void) | null>(null);
  const [containerId] = useState(() => `cdn-clappr-player-${Math.random().toString(36).substring(7)}`);
  
  const [isLoading, setIsLoading] = useState(true);
  const spinnerPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spinnerSafetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    let isMounted = true;

    const initPlayer = async () => {
      const container = playerContainerRef.current;
      if (!container) return;
      setIsLoading(true);

      try {
        // Clappr core is a UMD bundle: importing it registers window.Clappr.
        // Progressive mp4/webm uses Clappr's built-in HTML5 playback, so no
        // external plugins are required (avoids cross-core-version breakage).
        await import('@clappr/player');
        if (!isMounted || !window.Clappr) return;

        const isHlsSource = source.includes('.m3u8');

        if (!isMounted || !container) return;

        const plugins: any[] = [];

        const playerButtons = isMobile
          ? ['play', 'pip', 'fullscreen']
          : ['play', 'volume', 'pip', 'fullscreen'];

        const newPlayer = new window.Clappr.Player({
            parentId: `#${container.id}`,
            source,
            poster,
            width: '100%',
            height: '100%',
            autoPlay: autoPlay,
            volume: 10,
            watermark: watermark || '',
            watermarkLink: undefined,
            clickToToggle: true,
            playback: {
              playInline: true,
            },
            plugins: plugins,
            shakaConfiguration: {
              streaming: {
                rebufferingGoal: isMobile ? 10 : 15
              }
            },
            hlsjsConfig: {
              startLevel: -1,
              capLevelToPlayerSize: true,
              maxBufferLength: isMobile ? 30 : 60,
              maxMaxBufferLength: isMobile ? 60 : 120,
              enableWorker: true,
              lowLatencyMode: false,
            },
            mediacontrol: {
              seekbar: "hsl(var(--destructive))",
              buttons: playerButtons,
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
              onError: (e: any) => {
                if (isMounted) {
                  setIsLoading(false);
                  console.error("Clappr player error:", e);
                }
              },
            }
        });
        
        playerRef.current = newPlayer;

        // Hide the preloader only when a video frame is actually PRESENTED on
        // screen. Data events (loadeddata/canplay) fire before the frame is
        // painted, which left a black gap between spinner and picture.
        const settleSpinner = () => {
          if (spinnerPollRef.current) { clearInterval(spinnerPollRef.current); spinnerPollRef.current = null; }
          if (spinnerSafetyRef.current) { clearTimeout(spinnerSafetyRef.current); spinnerSafetyRef.current = null; }
          if (isMounted) setIsLoading(false);
        };
        let settled = false;
        const done = () => {
          if (settled || !isMounted) return;
          settled = true;
          settleSpinner();
        };
        const wireVideoElement = (): boolean => {
          const video = container.querySelector('video');
          if (!video) return false;
          // iOS/Android require playsinline to autoplay inline (otherwise the
          // browser blocks it). Set on ALL platforms — harmless on desktop.
          video.setAttribute('playsinline', '');
          video.setAttribute('webkit-playsinline', '');
          // If autoplaying, drive it via forceAutoplay (sets muted property +
          // playsinline + retries until the source is ready) so mobile browsers
          // actually start playback. Store the disposer for cleanup.
          if (autoPlay && isMounted) {
            autoplayDisposer.current = forceAutoplay(video, {
              onPlaying: done,
            });
          }
          // Wait for the video to actually start playing before hiding preloader
          video.addEventListener('playing', done, { once: true });
          spinnerSafetyRef.current = setTimeout(done, 10000);
          return true;
        };
        if (!wireVideoElement() && isMounted) {
          // Clappr injects the <video> tag asynchronously — poll briefly.
          spinnerPollRef.current = setInterval(() => {
            if (wireVideoElement() || !isMounted) {
              if (spinnerPollRef.current) clearInterval(spinnerPollRef.current);
              spinnerPollRef.current = null;
            }
          }, 200);
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
      if (autoplayDisposer.current) {
        autoplayDisposer.current();
        autoplayDisposer.current = null;
      }
      if (spinnerPollRef.current) {
        clearInterval(spinnerPollRef.current);
        spinnerPollRef.current = null;
      }
      if (spinnerSafetyRef.current) {
        clearTimeout(spinnerSafetyRef.current);
        spinnerSafetyRef.current = null;
      }
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

  // Effect to control playback based on autoPlay prop
  useEffect(() => {
    const player = playerRef.current;
    if (player && player.core) {
      if (autoPlay) {
        let attempts = 0;
        try { player.play(); } catch (e) { /* ignore */ }
        const retryId = setInterval(() => {
          attempts++;
          try {
            if (player.isPlaying()) {
              clearInterval(retryId);
              return;
            }
            player.play();
          } catch (e) { /* ignore */ }
          if (attempts >= 4) clearInterval(retryId);
        }, 600);
        return () => clearInterval(retryId);
      } else {
        player.pause();
      }
    }
  }, [autoPlay, isLoading]);

  useImperativeHandle(ref, () => ({ isLoading }), [isLoading]);

  return (
    <div className="w-full h-full relative bg-black">
      <div
        id={containerId}
        ref={playerContainerRef}
        className="w-full h-full"
      />
    </div>
  );
});

CdnClapprPlayer.displayName = 'CdnClapprPlayer';
export default CdnClapprPlayer;
