
'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import Preloader from './preloader';
import { cn } from '@/lib/utils';
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
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  const playerReadyRef = useRef(false);

  // Expose the player instance via the passed ref
  useImperativeHandle(ref, () => playerRef.current, []);

  // Effect for setting up and tearing down the player
  useEffect(() => {
    let isMounted = true;

    const initPlayer = async () => {
        const container = containerRef.current;
        if (!container) return;
        setIsLoading(true);

        const isYoutube = source.includes('youtube.com') || source.includes('youtu.be');
        const isVimeo = source.includes('vimeo.com');

        try {
            const { default: Plyr } = await import('plyr');

            // Clear previous player if any
            if (playerRef.current) {
                try {
                    playerRef.current.destroy();
                } catch (e) {
                    console.error("Error destroying previous Plyr player:", e);
                }
            }
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
            container.innerHTML = '';
            playerRef.current = null;
            hlsRef.current = null;
            playerReadyRef.current = false;

            if (!isMounted) return;

            let element: HTMLVideoElement | HTMLDivElement;
            if (isYoutube || isVimeo) {
                element = document.createElement('div');
                element.dataset.plyrProvider = isYoutube ? 'youtube' : 'vimeo';
                element.dataset.plyrEmbedId = source;
            } else {
                element = document.createElement('video');
                element.setAttribute('playsinline', '');
                element.setAttribute('controls', '');
                if (poster) {
                    element.setAttribute('poster', poster);
                }
                element.addEventListener('loadstart', () => {
                  if (isMounted) setIsLoading(true);
                });
                element.addEventListener('canplay', () => {
                  if (isMounted) setIsLoading(false);
                });
            }

            container.appendChild(element);

            let player: PlyrInstance | undefined;

            const onPlayerReady = () => {
                playerReadyRef.current = true;
                if (isMounted) setIsLoading(false);
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
                playerConfig.previewThumbnails = {
                    enabled: true,
                    src: thumbnailVttUrl,
                };
            }

            if (isYoutube || isVimeo) {
                player = new Plyr(element, playerConfig);
                wireEvents(player);
                if (isMounted) playerRef.current = player;
            } else if (source.includes('.m3u8') && Hls.isSupported()) {
                const hls = new Hls({
                  startLevel: isMobile ? 0 : -1, // Start with lower quality on mobile
                });
                hls.loadSource(source);

                hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                    if (!isMounted) return;

                    const availableQualities = hls.levels.map((l) => l.height);
                    availableQualities.unshift(0); // 0 will represent Auto

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
                        i18n: {
                            qualityLabel: {
                                0: 'Auto',
                            },
                        },
                    });

                    wireEvents(player);
                    if (isMounted) playerRef.current = player;
                });

                hls.attachMedia(element as HTMLVideoElement);
                hlsRef.current = hls;

                hls.on(Hls.Events.ERROR, (event, data) => {
                    if (isMounted && data.fatal) {
                        setIsLoading(false);
                    }
                });
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
        const hls = hlsRef.current;
        if (hls) {
            hls.destroy();
            hlsRef.current = null;
        }

        const player = playerRef.current;
        if (player) {
            try {
                player.stop();
                player.destroy();
            } catch (e) {
                console.error("Error destroying Plyr player:", e);
            }
        }
        playerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, poster, isMobile]); // Re-run if source, poster, or isMobile changes

  // Effect for controlling playback based on autoPlay prop
  useEffect(() => {
    let isMounted = true;
    const player = playerRef.current;
    if (player) {
        const handleReady = () => {
            if (isMounted && autoPlay && !player.playing) {
                try {
                    const playPromise = player.play();
                    if (playPromise !== undefined) {
                        playPromise.catch((e: any) => {
                            // Autoplay was prevented. This is a common browser policy.
                            if (isMounted) setIsLoading(false);
                        });
                    }
                } catch(e) {
                     if (isMounted) setIsLoading(false);
                }
            } else if (!autoPlay && player.playing) {
                 try {
                   player.pause();
                } catch(e) {/* ignore */}
            }
        };

        if (playerReadyRef.current) {
             handleReady();
        } else {
            player.once('ready', handleReady);
        }

        return () => {
            isMounted = false;
            player.off('ready', handleReady);
            if (player && player.playing) {
                try {
                    player.pause();
                } catch(e) {
                    // It might already be destroyed
                }
            }
        };
    }
  }, [autoPlay, isLoading]);


  return (
    <div className={cn("relative w-full h-full", "force-gpu")}>
      {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 pointer-events-none">
              <Preloader />
          </div>
      )}
      <div ref={containerRef} className={cn("relative w-full h-full transition-opacity duration-300", isLoading ? 'opacity-0' : 'opacity-100')}>
         {/* Plyr will be injected here */}
      </div>
    </div>
  );
});

PlyrPlayer.displayName = 'PlyrPlayer';
export default PlyrPlayer;
