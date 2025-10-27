
'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import Preloader from './preloader';
import { cn } from '@/lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEject } from '@fortawesome/free-solid-svg-icons';


// Make Plyr and Hls available on the window object for type safety
declare global {
    interface Window {
        Plyr: any;
        Hls: any;
    }
}

interface PlyrPlayerProps {
  source: string;
  poster?: string;
  watermark?: string;
  autoPlay?: boolean;
  thumbnailVttUrl?: string;
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

const loadStylesheet = (href: string, id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (document.getElementById(id)) {
            resolve();
            return;
        }
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = () => resolve();
        link.onerror = (e) => reject(new Error(`Failed to load stylesheet: ${href}.`));
        document.head.appendChild(link);
    });
};


const waitForGlobal = (name: string, timeout = 2000): Promise<void> => {
    return new Promise((resolve, reject) => {
        let waited = 0;
        const interval = 100;

        const check = () => {
            if ((window as any)[name]) {
                resolve();
            } else if (waited >= timeout) {
                reject(new Error(`Timed out waiting for global variable '${name}'`));
            } else {
                waited += interval;
                setTimeout(check, interval);
            }
        };
        check();
    });
};


const PlyrPlayer = forwardRef(({ source, poster, watermark, autoPlay = true, thumbnailVttUrl }: PlyrPlayerProps, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const hlsRef = useRef<any>(null);
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);

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
            await loadStylesheet('https://cdn.plyr.io/3.8.3/plyr.css', 'plyr-css');
            await loadScript('https://cdn.plyr.io/3.8.3/plyr.js', 'plyr-script');
            await waitForGlobal('Plyr');
            
            if (!isMounted) return;

            // Clear previous player if any
            container.innerHTML = '';

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
            
            let player: any;

            const mobileControls = ['play-large', 'play', 'progress', 'current-time', 'settings', 'pip', 'fullscreen'];
            const desktopControls = ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'pip', 'fullscreen'];
            const controls = isMobile ? mobileControls : desktopControls;

            const playerConfig: any = {
                controls: controls,
                autoplay: autoPlay,
                playsinline: true,
                clickToPlay: true,
                settings: ['quality', 'speed', 'loop'],
                fullscreen: {
                    enabled: true,
                    fallback: true,
                    iosNative: true,
                },
                pip: true,
            };
            
            if (thumbnailVttUrl) {
                playerConfig.previewThumbnails = {
                    enabled: true,
                    src: thumbnailVttUrl,
                };
            }

            if (isYoutube || isVimeo) {
                playerConfig.previewThumbnails = {
                    enabled: true,
                    src: thumbnailVttUrl,
                };
                player = new window.Plyr(element, playerConfig);
                player.on('ready', () => {
                    if (isMounted) setIsLoading(false);
                });
                if (isMounted) playerRef.current = player;
            } else if (source.includes('.m3u8')) {
                await loadScript('https://cdn.jsdelivr.net/npm/hls.js@latest', 'hls-script');
                await waitForGlobal('Hls');

                if (!isMounted) return;

                if (window.Hls.isSupported()) {
                    const hls = new window.Hls({
                      startLevel: isMobile ? 0 : -1, // Start with lower quality on mobile
                    });
                    hls.loadSource(source);
                    
                    hls.on(window.Hls.Events.MANIFEST_PARSED, (event: any, data: any) => {
                        if (!isMounted) return;

                        const availableQualities = hls.levels.map((l) => l.height);
                        availableQualities.unshift(0); // 0 will represent Auto

                        player = new window.Plyr(element, {
                            ...playerConfig,
                            quality: {
                                default: 0,
                                options: availableQualities,
                                forced: true,
                                onChange: (quality: number) => {
                                    if (hls) {
                                      hls.currentLevel = quality === 0 ? -1 : hls.levels.findIndex(level => level.height === quality);
                                    }
                                },
                            },
                            i18n: {
                                qualityLabel: {
                                    0: 'Auto',
                                },
                            },
                        });
                        
                        if(isMounted) playerRef.current = player;
                    });
                    
                    hls.attachMedia(element as HTMLVideoElement);
                    hlsRef.current = hls;

                } else {
                    // Fallback for browsers that support HLS natively
                    (element as HTMLVideoElement).src = source;
                     player = new window.Plyr(element, playerConfig);
                     if (isMounted) playerRef.current = player;
                }
            } else {
                 player = new window.Plyr(element, playerConfig);
                (element as HTMLVideoElement).src = source;
                if (isMounted) playerRef.current = player;
            }
            
            if (!isMounted && player) {
              player.destroy();
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
        const currentContainer = containerRef.current;

        if (player && currentContainer && document.body.contains(currentContainer)) {
            try {
                player.stop();
                currentContainer.innerHTML = '';
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
    const player = playerRef.current;
    if (player && player.ready) {
      if (autoPlay) {
        player.play();
      } else {
        player.pause();
      }
    }
  }, [autoPlay, isLoading]); // Re-run when isLoading changes to ensure play is called after ready

  return (
    <div className={cn("relative w-full h-full bg-black", "force-gpu")}>
      <style>
        {`
          :root {
            --plyr-color-main: hsl(var(--destructive));
            --plyr-control-radius: 8px;
            --plyr-font-family: 'Quicksand', sans-serif;
          }
          .plyr {
            width: 100%;
            height: 100%;
          }
          .plyr--video .plyr__controls {
            background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
          }
          .plyr__control--overlaid {
            background: rgba(0,0,0,0.6);
            border-radius: 50%;
          }
          .plyr__control:hover {
            background: hsl(var(--destructive));
          }
          .plyr--full-ui.plyr--video .plyr__control--overlaid {
            display: none !important;
          }
           .plyr__watermark {
            position: absolute;
            top: 15px;
            right: 15px;
            width: 8%;
            height: auto;
            filter: brightness(0) invert(1);
            opacity: 0.1;
            transition: opacity 0.3s;
            z-index: 10;
          }
          .plyr__watermark:hover {
            opacity: 0.5;
          }
          .plyr__spinner-container {
             display: none !important;
           }
          .plyr__progress input[type="range"], .plyr__volume input[type=range] {
              height: 2px !important;
          }

          /* Hide original SVG icons */
          .plyr__controls .plyr__control svg {
            display: none !important;
          }
          /* Style the ::before pseudo-element with Font Awesome */
          .plyr__controls .plyr__control::before {
            font-family: "Font Awesome 6 Free";
            font-weight: 900;
            font-style: normal;
            font-size: 20px;
            line-height: 1;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            transform: translateY(1px); /* Vertical alignment */
          }
          
          /* Icon mapping */
          button.plyr__control[data-plyr="play"]::before { content: '\\f144' !important; }
          .plyr--playing button.plyr__control[data-plyr="play"]::before { content: '\\f28b' !important; }
          button.plyr__control[data-plyr="mute"]::before { content: '\\f028' !important; }
          button.plyr__control[data-plyr="mute"].plyr__control--pressed::before { content: '\\f6a9' !important; }
          button.plyr__control[data-plyr="pip"]::before { content: '\\f2d0' !important; }
          button.plyr__control[data-plyr="fullscreen"]::before { content: '\\f065' !important; }
          button.plyr__control[data-plyr="fullscreen"].plyr__control--pressed::before { content: '\\f066' !important; }
          button.plyr__control[data-plyr="settings"]::before { content: '\\f052' !important; }
          
          /* Expandable volume on desktop */
          @media (min-width: 768px) {
            .plyr__controls .plyr__volume {
              display: flex;
              align-items: center;
              width: 38px; /* Width of the button */
              transition: width 0.3s ease;
              overflow: hidden;
            }

            .plyr__controls .plyr__volume:hover {
              width: 120px; /* Expanded width */
            }

            .plyr__controls .plyr__volume input[type=range] {
              max-width: 0;
              opacity: 0;
              margin-left: 0;
              transition: max-width 0.3s ease 0.1s, opacity 0.3s ease 0.1s;
            }

            .plyr__controls .plyr__volume:hover input[type=range] {
              max-width: 80px;
              opacity: 1;
              margin-left: 8px;
            }
          }
          .plyr__poster + .plyr__controls {
            z-index: 1; /* Ensure controls are above the poster */
          }
          .plyr__poster.plyr__poster-loading {
              z-index: 0;
          }
        `}
      </style>
      {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 pointer-events-none">
              <Preloader />
          </div>
      )}
      <div ref={containerRef} className={cn("relative w-full h-full transition-opacity duration-300", isLoading ? 'opacity-0' : 'opacity-100')}>
         {/* Plyr will be injected here */}
        {watermark && (
            <div className="plyr__watermark">
                <img src={watermark} alt="Watermark" />
            </div>
        )}
      </div>
    </div>
  );
});

PlyrPlayer.displayName = 'PlyrPlayer';
export default PlyrPlayer;
