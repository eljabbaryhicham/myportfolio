
'use client';
import { useEffect, useRef, useState } from 'react';
import Preloader from './preloader';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

// Make Clappr and its plugins available on the window object for type safety
declare global {
    interface Window {
        Clappr: any;
        DashShakaPlayback: any;
        LevelSelector: any;
        HlsJsPlayback: any;
    }
}

interface CdnClapprPlayerProps {
  source: string;
  poster?: string;
  autoPlay?: boolean;
  watermark?: string;
}

const loadScript = (src: string, id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (document.getElementById(id)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.id = id;
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = (e) => reject(new Error(`Failed to load script: ${src}.`));
        document.head.appendChild(script);
    });
};

export default function CdnClapprPlayer({ source, poster, autoPlay = true, watermark }: CdnClapprPlayerProps) {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  // Stable id — regenerating it on every render can desync Clappr's
  // `parentId` lookup while scripts are still loading.
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
        await loadScript('https://cdn.jsdelivr.net/npm/@clappr/player@latest/dist/clappr.min.js', 'clappr-script');
        
        if (!isMounted) return;

        const canNativeHls = (() => {
          const v = document.createElement('video');
          return !!v.canPlayType('application/vnd.apple.mpegurl');
        })();
        const isHlsSource = source.includes('.m3u8');
        const needHlsJs = isHlsSource && !canNativeHls;

        const extraScripts: Promise<void>[] = [
            loadScript('https://cdn.jsdelivr.net/gh/clappr/dash-shaka-playback@latest/dist/dash-shaka-playback.js', 'clappr-shaka-playback'),
            loadScript('https://cdn.jsdelivr.net/gh/clappr/clappr-level-selector-plugin@latest/dist/level-selector.min.js', 'clappr-level-selector'),
        ];
        if (needHlsJs) {
          extraScripts.push(loadScript('https://cdn.jsdelivr.net/npm/@clappr/hlsjs-playback@latest/dist/hlsjs-playback.min.js', 'clappr-hls-playback'));
        }
        await Promise.all(extraScripts);

        if (!isMounted || !container) return;
        
        const plugins = [];
        if (window.DashShakaPlayback) plugins.push(window.DashShakaPlayback);
        if (window.LevelSelector) plugins.push(window.LevelSelector);
        if (needHlsJs && window.HlsJsPlayback) plugins.push(window.HlsJsPlayback);

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
                rebufferingGoal: isMobile ? 6 : 15
              }
            },
            hlsjsConfig: isMobile ? {
              startLevel: 0,
              capLevelToPlayerSize: true,
              maxBufferLength: 12,
              maxMaxBufferLength: 15,
            } : {},
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
          const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
          if (isAndroid) {
            video.setAttribute('webkit-playsinline', '');
            video.setAttribute('playsinline', '');
          }
          const rvfc = (video as any).requestVideoFrameCallback;
          if (rvfc) {
            rvfc.call(video, () => requestAnimationFrame(() => done()));
          } else {
            video.addEventListener('playing', done, { once: true });
            video.addEventListener('loadeddata', () => setTimeout(done, 300), { once: true });
          }
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
    if (player && player.core) { // Ensure player core is available
      if (autoPlay) {
        // Autoplay can transiently fail (browser policy timing, player not
        // fully attached yet). Retry a few times — still unmuted.
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
  }, [autoPlay, isLoading]); // Re-run when isLoading changes to ensure play is called after ready

  return (
    <div className="w-full h-full relative bg-black">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 pointer-events-none">
            <Preloader />
        </div>
      )}
      <div
        id={containerId}
        ref={playerContainerRef}
        className="w-full h-full"
      />
    </div>
  );
}
