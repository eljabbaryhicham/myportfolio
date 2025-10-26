
'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import 'plyr/dist/plyr.css';
import { useIsMobile } from '@/hooks/use-mobile';
import Preloader from './preloader';
import { cn } from '@/lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


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


const PlyrPlayer = forwardRef(({ source, poster, watermark, autoPlay = true }: PlyrPlayerProps, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const hlsRef = useRef<any>(null);
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);

  // Expose the player instance via the passed ref
  useImperativeHandle(ref, () => playerRef.current, []);

  // Effect for setting up and tearing down the player
  useEffect(() => {
    let isMounted = true;
    const initPlayer = async () => {
        if (!containerRef.current) return;
        setIsLoading(true);

        try {
            await loadScript('https://cdn.jsdelivr.net/npm/plyr@3.7.8/dist/plyr.min.js', 'plyr-script');
            await waitForGlobal('Plyr');
            
            if (!isMounted) return;

            const videoElement = document.createElement('video');
            videoElement.setAttribute('playsinline', '');
            videoElement.setAttribute('controls', '');
            if (poster) {
                videoElement.setAttribute('poster', poster);
            }
            containerRef.current.appendChild(videoElement);
            
             videoElement.addEventListener('canplay', () => {
              if (isMounted) setIsLoading(false);
            });
             videoElement.addEventListener('playing', () => {
              if (isMounted) {
                setIsLoading(false);
                setIsBuffering(false);
              }
            });
             videoElement.addEventListener('waiting', () => {
              if (isMounted) setIsBuffering(true);
            });
             videoElement.addEventListener('stalled', () => {
              if (isMounted) setIsBuffering(true);
            });
            videoElement.addEventListener('loadstart', () => {
              if(isMounted) setIsLoading(true);
            });


            let player: any;

            const mobileControls = ['play-large', 'play', 'progress', 'current-time', 'settings', 'pip', 'fullscreen'];
            const desktopControls = ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'pip', 'fullscreen'];
            const controls = isMobile ? mobileControls : desktopControls;

            if (source.includes('.m3u8')) {
                await loadScript('https://cdn.jsdelivr.net/npm/hls.js@latest', 'hls-script');
                await waitForGlobal('Hls');

                if (!isMounted) return;

                if (window.Hls.isSupported()) {
                    const hls = new window.Hls();
                    hls.loadSource(source);
                    
                    hls.on(window.Hls.Events.MANIFEST_PARSED, (event: any, data: any) => {
                        if (!isMounted) return;

                        const availableQualities = hls.levels.map((l) => l.height);
                        // Add 'Auto' quality option
                        availableQualities.unshift(0); // 0 will represent Auto

                        player = new window.Plyr(videoElement, {
                            controls: controls,
                            autoplay: autoPlay,
                            playsinline: true,
                            clickToPlay: true,
                            settings: ['quality', 'speed'],
                            quality: {
                                default: 0, // Default to Auto
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
                            fullscreen: {
                                enabled: true,
                                fallback: true,
                                iosNative: true,
                            },
                            pip: true,
                        });
                        
                        if(isMounted) playerRef.current = player;
                    });
                    
                    hls.attachMedia(videoElement);
                    hlsRef.current = hls;

                } else {
                    // Fallback for browsers that support HLS natively but not Media Source Extensions (like Safari on iOS)
                    videoElement.src = source;
                     player = new window.Plyr(videoElement, {
                        controls: controls,
                        autoplay: autoPlay,
                        playsinline: true,
                        pip: true,
                        fullscreen: {
                            enabled: true,
                            fallback: true,
                            iosNative: true,
                        },
                     });
                     if (isMounted) playerRef.current = player;
                }
            } else {
                 player = new window.Plyr(videoElement, {
                    controls: controls,
                    autoplay: autoPlay,
                    playsinline: true,
                    clickToPlay: true,
                    settings: ['speed'],
                    fullscreen: {
                        enabled: true,
                        fallback: true,
                        iosNative: true,
                    },
                    pip: true,
                });
                videoElement.src = source;
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
        const player = playerRef.current;
        const hls = hlsRef.current;
        if (hls) {
            hls.destroy();
        }
        if (player) {
            try {
                player.destroy();
            } catch (e) {
                console.error("Error destroying Plyr player:", e);
            }
        }
        if (containerRef.current) {
            containerRef.current.innerHTML = '';
        }
        playerRef.current = null;
        hlsRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, poster, isMobile]); // Re-run if source, poster, or isMobile changes

  // Effect for controlling playback based on autoPlay prop
  useEffect(() => {
    const player = playerRef.current;
    if (player) {
      if (autoPlay) {
        player.play();
      } else {
        player.pause();
      }
    }
  }, [autoPlay]);

  return (
    <div className="relative w-full h-full bg-black">
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
          .plyr__progress input[type=range], .plyr__volume input[type=range] {
              height: 2px !important;
          }

          /* Font Awesome Icons Override */
          .plyr__controls .plyr__control svg {
            display: none !important;
          }
          .plyr__controls .plyr__control::before {
            font-family: 'Font Awesome 6 Free';
            font-weight: 900;
            font-style: normal;
            font-size: 20px;
            line-height: 1;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          button[data-plyr="play"]::before { content: '\\f144' !important; }
          .plyr--playing button[data-plyr="play"]::before { content: '\\f28b' !important; }
          button[data-plyr="mute"]::before { content: '\\f028' !important; }
          .plyr__control--pressed[data-plyr="mute"]::before { content: '\\f6a9' !important; }
          button[data-plyr="pip"]::before { content: '\\f2d0' !important; }
          button[data-plyr="fullscreen"]::before { content: '\\f065' !important; }
          .plyr__control--pressed[data-plyr="fullscreen"]::before { content: '\\f066' !important; }
          button[data-plyr="settings"]::before { content: '\\f013' !important; }
        `}
      </style>
        {(isLoading || isBuffering) && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20">
                <Preloader />
            </div>
        )}
      <div ref={containerRef} className={cn("relative w-full h-full", isLoading ? 'opacity-0' : 'opacity-100')}>
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
