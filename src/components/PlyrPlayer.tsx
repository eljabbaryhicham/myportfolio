
'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import Preloader from './preloader';
import 'plyr/dist/plyr.css';
import Hls from 'hls.js';

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
  const hlsRef = useRef<Hls | null>(null);
  const nativeVideoRef = useRef<HTMLVideoElement | null>(null);
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  const playerReadyRef = useRef(false);

  useImperativeHandle(ref, () => playerRef.current, []);

  // iOS: skip Plyr + hls.js entirely — Safari's native HLS is faster.
  // Desktop/Android: use Plyr with hls.js for HLS, native for mp4.
  useEffect(() => {
    let isMounted = true;

    const initPlayer = async () => {
        const container = containerRef.current;
        if (!container) return;
        setIsLoading(true);

        const isYoutube = source.includes('youtube.com') || source.includes('youtu.be');
        const isVimeo = source.includes('vimeo.com');
        const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
          || (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);

        try {
            // Cleanup previous
            if (playerRef.current) {
                try { playerRef.current.destroy(); } catch {}
            }
            if (hlsRef.current) { hlsRef.current.destroy(); }
            if (nativeVideoRef.current) { nativeVideoRef.current.pause(); nativeVideoRef.current.removeAttribute('src'); nativeVideoRef.current.load(); }
            container.innerHTML = '';
            playerRef.current = null;
            hlsRef.current = null;
            nativeVideoRef.current = null;
            playerReadyRef.current = false;
            if (!isMounted) return;

            // ── iOS: native <video> with Safari HLS ──────────────────────
            if (isIOS && !isYoutube && !isVimeo) {
                const video = document.createElement('video');
                video.setAttribute('controls', '');
                video.setAttribute('playsinline', '');
                // @ts-ignore
                video.setAttribute('webkit-playsinline', 'true');
                video.setAttribute('preload', 'metadata');
                video.setAttribute('crossorigin', 'anonymous');
                if (poster) video.setAttribute('poster', poster);

                let settled = false;
                const done = () => {
                    if (settled || !isMounted) return;
                    settled = true;
                    setIsLoading(false);
                };

                const rvfc = (video as any).requestVideoFrameCallback;
                if (rvfc) {
                    rvfc.call(video, () => requestAnimationFrame(() => done()));
                } else {
                    video.addEventListener('playing', done, { once: true });
                    video.addEventListener('loadeddata', done, { once: true });
                }
                video.addEventListener('canplay', () => setTimeout(done, 200), { once: true });
                video.addEventListener('error', done, { once: true });
                const safety = setTimeout(done, 8000);

                video.src = source;
                container.appendChild(video);
                nativeVideoRef.current = video;
                if (autoPlay) {
                    video.play().catch(() => {});
                }
                return;
            }

            // ── Desktop/Android: Plyr + hls.js ──────────────────────────
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
                video.setAttribute('controls', '');
                video.setAttribute('preload', 'metadata');
                const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
                if (isAndroid) {
                    video.setAttribute('webkit-playsinline', '');
                    video.setAttribute('crossorigin', 'anonymous');
                }
                if (poster) video.setAttribute('poster', poster);
                let settled = false;
                const done = () => {
                    if (settled || !isMounted) return;
                    settled = true;
                    setIsLoading(false);
                };
                const rvfc = (video as any).requestVideoFrameCallback;
                if (rvfc) {
                    rvfc.call(video, () => requestAnimationFrame(() => done()));
                } else {
                    ['playing', 'loadeddata'].forEach((evt) =>
                        video.addEventListener(evt, done, { once: true })
                    );
                }
                video.addEventListener('canplay', () => setTimeout(done, 300), { once: true });
                const safety = setTimeout(done, 10000);
                video.addEventListener('loadstart', () => {
                    if (isMounted && !settled) setIsLoading(true);
                });
                element = video;
            }

            container.appendChild(element);

            let player: PlyrInstance | undefined;

            const onPlayerReady = () => {
                playerReadyRef.current = true;
                if ((isYoutube || isVimeo) && isMounted) setIsLoading(false);
            };
            const onPlayerError = () => {
                if (isMounted) setIsLoading(false);
            };
            const wireEvents = (p: PlyrInstance) => {
                p.on('ready', onPlayerReady);
                p.on('error', onPlayerError);
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
            } else if (source.includes('.m3u8') && Hls.isSupported()) {
                const hls = new Hls({
                    startLevel: -1,
                    capLevelToPlayerSize: true,
                    maxBufferLength: isMobile ? 30 : 60,
                    maxMaxBufferLength: isMobile ? 60 : 120,
                    enableWorker: true,
                    lowLatencyMode: false,
                });
                hls.loadSource(source);

                hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
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
                player = new Plyr(element, playerConfig);
                (element as HTMLVideoElement).src = source;
                wireEvents(player);
                if (isMounted) playerRef.current = player;
            }

        } catch (error) {
            console.error("Error initializing Plyr player:", error);
            if (isMounted) setIsLoading(false);
        }
    };

    initPlayer();

    return () => {
        isMounted = false;
        if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
        if (nativeVideoRef.current) {
            nativeVideoRef.current.pause();
            nativeVideoRef.current.removeAttribute('src');
            nativeVideoRef.current.load();
            nativeVideoRef.current = null;
        }
        const player = playerRef.current;
        if (player) {
            try { player.stop(); player.destroy(); } catch {}
        }
        playerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, poster, isMobile]);

  // Playback control: autoplay / pause
  useEffect(() => {
    let isMounted = true;

    // iOS native video
    const nativeVid = nativeVideoRef.current;
    if (nativeVid) {
        if (autoPlay) {
            nativeVid.play().catch(() => {});
        } else {
            nativeVid.pause();
        }
        return () => { isMounted = false; };
    }

    // Plyr instance
    const player = playerRef.current;
    if (player) {
        const handleReady = () => {
            if (isMounted && autoPlay && !player.playing) {
                let attempts = 0;
                const tryPlay = () => {
                    attempts++;
                    try {
                        const playPromise = player.play();
                        if (playPromise !== undefined && typeof playPromise.catch === 'function') {
                            playPromise.catch(() => {
                                if (attempts < 4) setTimeout(tryPlay, 600);
                                else if (isMounted) setIsLoading(false);
                            });
                        }
                    } catch {
                        if (attempts < 4) setTimeout(tryPlay, 600);
                        else if (isMounted) setIsLoading(false);
                    }
                };
                tryPlay();
            } else if (!autoPlay && player.playing) {
                try { player.pause(); } catch {}
            }
        };
        if (playerReadyRef.current) handleReady();
        else player.once('ready', handleReady);

        return () => {
            isMounted = false;
            player.off('ready', handleReady);
            if (player.playing) try { player.pause(); } catch {}
        };
    } else {
        setIsLoading(false);
    }
  }, [autoPlay, isLoading]);


  return (
    <div className="relative w-full h-full">
      {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black pointer-events-none">
              <Preloader />
          </div>
      )}
      <div ref={containerRef} className="relative w-full h-full">
         {/* Plyr will be injected here */}
      </div>
    </div>
  );
});

PlyrPlayer.displayName = 'PlyrPlayer';
export default PlyrPlayer;
