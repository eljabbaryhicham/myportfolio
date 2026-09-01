
'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import Preloader from './preloader';
import 'plyr/dist/plyr.css';
import { logger } from '@/lib/logger';
import { forceAutoplay } from '@/lib/video-autoplay';

type PlyrCtor = typeof import('plyr')['default'];
type PlyrInstance = InstanceType<PlyrCtor>;
type PlyrOptions = NonNullable<ConstructorParameters<PlyrCtor>[1]>;

interface PlyrPlayerProps {
  source: string;
  poster?: string;
  autoPlay?: boolean;
  thumbnailVttUrl?: string;
}

const PlyrPlayer = forwardRef(({ source, poster, autoPlay = true, thumbnailVttUrl }: PlyrPlayerProps, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlyrInstance | null>(null);
  const hlsRef = useRef<any | null>(null);
  const isMobile = useIsMobile();
  // Latch: hide preloader the moment playback starts; never re-show on
  // later loadstart/buffering.
  const [hasPlayed, setHasPlayed] = useState(false);
  const playerReadyRef = useRef(false);
  const wasPlayingBeforePauseRef = useRef(false);

  useImperativeHandle(ref, () => ({
    isLoading: !hasPlayed,
    plyr: playerRef.current,
    pause: () => {
      try { const p = playerRef.current; if (p && typeof p.pause === 'function') p.pause(); } catch {}
    },
    play: () => {
      try { const p = playerRef.current; if (p && typeof p.play === 'function') p.play(); } catch {}
    },
    isPlaying: () => {
      try { const p = playerRef.current; if (p) return !!p.playing; } catch {}
      return false;
    },
  }), [hasPlayed]);

  useEffect(() => {
    let isMounted = true;

    const initPlayer = async () => {
        const container = containerRef.current;
        if (!container) return;
        setHasPlayed(false);

        const isYoutube = source.includes('youtube.com') || source.includes('youtu.be');
        const isVimeo = source.includes('vimeo.com');

        try {
            if (playerRef.current) {
                try { playerRef.current.destroy(); } catch {}
            }
            if (hlsRef.current) { hlsRef.current.destroy(); }
            container.innerHTML = '';
            playerRef.current = null;
            hlsRef.current = null;
            playerReadyRef.current = false;
            if (!isMounted) return;

            const { default: Plyr } = await import('plyr');
            if (!isMounted) return;

            let element: HTMLVideoElement | HTMLDivElement;
            if (isYoutube || isVimeo) {
                element = document.createElement('div');
                element.dataset.plyrProvider = isYoutube ? 'youtube' : 'vimeo';
                element.dataset.plyrEmbedId = source;
            } else {
                const video = document.createElement('video');
                video.setAttribute('playsinline', '');
                video.setAttribute('webkit-playsinline', '');
                video.setAttribute('controls', '');
                video.setAttribute('preload', 'auto');
                // Force-unmute autoplay: attempt playback with sound. Browsers
                // block unmuted autoplay on mobile, so it will not start there.
                if (poster) video.setAttribute('poster', poster);
                let settled = false;
                const done = () => {
                    if (settled || !isMounted) return;
                    settled = true;
                    setHasPlayed(true);
                };
                // Hide preloader the moment playback starts; never re-show on
                // later loadstart/buffering.
                video.addEventListener('playing', done, { once: true });
                // Safety: if playing never fires (e.g. autoplay blocked), fallback after delay
                setTimeout(done, 4000);
                element = video;
            }

            container.appendChild(element);

            let player: PlyrInstance | undefined;

            const onPlayerReady = () => {
                playerReadyRef.current = true;
                // For click-to-play (autoPlay false) hide preloader once ready so poster + play button show.
                // For autoplay keep preloader until playing to avoid controls + preloader overlap.
                if (!autoPlay && isMounted) setHasPlayed(true);
            };
            const onPlayerError = () => {
                if (isMounted) setHasPlayed(true);
            };
            const wireEvents = (p: PlyrInstance) => {
                p.on('ready', onPlayerReady);
                p.on('error', onPlayerError);
                // Hide the preloader once muted autoplay has started. Sound
                // remains a visitor choice so iOS does not pause playback.
                p.on('playing', () => {
                  if (isMounted) {
                    setHasPlayed(true);
                  }
                });
            };

            const mobileControls = ['play-large', 'play', 'current-time', 'progress', 'settings', 'pip', 'fullscreen'];
            const desktopControls = ['play-large', 'play', 'current-time', 'mute', 'volume', 'progress', 'settings', 'pip', 'fullscreen'];
            const controls = isMobile ? mobileControls : desktopControls;

            const playerConfig: PlyrOptions = {
                controls: controls,
                autoplay: autoPlay,
                clickToPlay: true,
                settings: ['quality', 'speed', 'loop'],
                fullscreen: {
                    enabled: true,
                    fallback: true,
                    iosNative: true,
                },
            };

            if (thumbnailVttUrl) {
                playerConfig.previewThumbnails = { enabled: true, src: thumbnailVttUrl };
            }

            if (isYoutube || isVimeo) {
                player = new Plyr(element, playerConfig);
                wireEvents(player);
                if (isMounted) playerRef.current = player;
            } else if (source.includes('.m3u8')) {
                // hls.js is code-split so the ~500 KB library isn't downloaded
                // for /work navigation — it loads lazily only when an HLS source
                // actually plays (mirrors the homepage hero player's pattern).
                const { default: Hls } = await import('hls.js');
                if (Hls.isSupported()) {
                    const hls = new Hls({
                        startLevel: -1,
                        capLevelToPlayerSize: true,
                        maxBufferLength: isMobile ? 30 : 60,
                        maxMaxBufferLength: isMobile ? 60 : 120,
                        enableWorker: true,
                        lowLatencyMode: false,
                    });
                    hls.loadSource(source);

                    hls.on(Hls.Events.MANIFEST_PARSED, () => {
                        if (!isMounted) return;

                        const availableQualities = hls.levels.map((l) => l.height);
                        availableQualities.unshift(0);

                        player = new Plyr(element, {
                            ...playerConfig,
                            quality: {
                                default: 0,
                                options: availableQualities,
                                forced: true,
                                onChange: (quality: number) => {
                                    if (hls) {
                                        hls.currentLevel = quality === 0 ? -1 : hls.levels.findIndex((level) => level.height === quality);
                                    }
                                },
                            },
                            i18n: { qualityLabel: { 0: 'Auto' } },
                        });

                        wireEvents(player);
                        if (isMounted) playerRef.current = player;
                    });

                    hls.attachMedia(element as HTMLVideoElement);
                    hlsRef.current = hls;
                } else {
                    // No hls.js support: fall back to a plain player (native HLS in
                    // modern browsers handles the manifest itself).
                    player = new Plyr(element, playerConfig);
                    (element as HTMLVideoElement).src = source;
                    wireEvents(player);
                    if (isMounted) playerRef.current = player;
                    if (autoPlay && isMounted) {
                        const v = element as HTMLVideoElement;
                        v.setAttribute('playsinline', '');
                        v.setAttribute('webkit-playsinline', '');
                        try { forceAutoplay(v); } catch {}
                    }
                }
            } else {
                player = new Plyr(element, playerConfig);
                (element as HTMLVideoElement).src = source;
                wireEvents(player);
                if (isMounted) playerRef.current = player;
                // Speedup: ensure autoplay starts fast via forceAutoplay (muted+retry) then unmute for sound
                if (autoPlay && isMounted) {
                  const v = element as HTMLVideoElement;
                  v.setAttribute('playsinline', '');
                  v.setAttribute('webkit-playsinline', '');
                  try { forceAutoplay(v); } catch {}
                }
            }

            // Also handle HLS case where player created async - forceAutoplay via container query
            if (autoPlay && isMounted) {
              const v = container.querySelector('video') as HTMLVideoElement | null;
              if (v) {
                v.setAttribute('playsinline', '');
                v.setAttribute('webkit-playsinline', '');
                try { forceAutoplay(v); } catch {}
              }
            }

        } catch (error) {
            logger.error("Error initializing Plyr player:", error);
            if (isMounted) setHasPlayed(true);
        }
    };

    initPlayer();

    return () => {
        isMounted = false;
        if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
        const player = playerRef.current;
        if (player) {
            try { player.stop(); player.destroy(); } catch {}
        }
        playerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, poster, isMobile]);

  // Pause/resume when detail/contact dialog opens/closes — restores the
  // "pause video when open detail or contact" option that was lost during
  // the hard reset. The outer work/page.tsx also toggles autoPlay prop,
  // but this internal handler guarantees pause even if ref wiring is stale.
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    try {
      if (autoPlay) {
        if (wasPlayingBeforePauseRef.current && !player.playing) {
          const p = (player.play() as unknown) as Promise<void> | void;
          if (p && typeof (p as Promise<void>).catch === 'function') (p as Promise<void>).catch(() => {});
        }
        wasPlayingBeforePauseRef.current = false;
      } else {
        wasPlayingBeforePauseRef.current = !!player.playing;
        if (player.playing) player.pause();
      }
    } catch {}
  }, [autoPlay]);

  return (
    <div className="absolute inset-0 bg-black">
      <div ref={containerRef} className="w-full h-full">
         {/* Plyr will be injected here */}
      </div>
      {!hasPlayed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black pointer-events-none z-10">
          <Preloader />
        </div>
      )}
    </div>
  );
});

PlyrPlayer.displayName = 'PlyrPlayer';
export default PlyrPlayer;
