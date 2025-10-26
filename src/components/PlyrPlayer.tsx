
'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import 'plyr/dist/plyr.css';

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


const PlyrPlayer = forwardRef(({ source, poster, watermark, autoPlay = true }: PlyrPlayerProps, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const hlsRef = useRef<any>(null);

  // Expose the player instance via the passed ref
  useImperativeHandle(ref, () => playerRef.current, []);

  // Effect for setting up and tearing down the player
  useEffect(() => {
    let isMounted = true;
    const initPlayer = async () => {
        if (!containerRef.current) return;

        try {
            await loadScript('https://cdn.jsdelivr.net/npm/plyr@3.7.8/dist/plyr.min.js', 'plyr-script');
            if (!isMounted) return;

            const videoElement = document.createElement('video');
            videoElement.setAttribute('playsinline', '');
            videoElement.setAttribute('controls', '');
            if (poster) {
                videoElement.setAttribute('poster', poster);
            }
            containerRef.current.appendChild(videoElement);

            let player: any;

            if (source.includes('.m3u8')) {
                await loadScript('https://cdn.jsdelivr.net/npm/hls.js@latest', 'hls-script');
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
                            controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'pip', 'fullscreen'],
                            autoplay: autoPlay,
                            playsinline: true,
                            clickToPlay: true,
                            settings: ['quality', 'speed'],
                            quality: {
                                default: 0, // Default to Auto
                                options: availableQualities,
                                forced: true,
                                onChange: (quality: number) => {
                                    if (quality === 0) {
                                        // Set to -1 for automatic level selection
                                        hls.currentLevel = -1;
                                    } else {
                                        hls.levels.forEach((level, levelIndex) => {
                                            if (level.height === quality) {
                                                hls.currentLevel = levelIndex;
                                            }
                                        });
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
                    // Fallback for browsers that support HLS natively but not Media Source Extensions
                    videoElement.src = source;
                     player = new window.Plyr(videoElement, {
                        autoplay: autoPlay,
                        playsinline: true,
                        fullscreen: {
                            enabled: true,
                            fallback: true,
                            iosNative: true,
                        },
                        pip: true,
                     });
                }
            } else {
                 player = new window.Plyr(videoElement, {
                    controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'pip', 'fullscreen'],
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
            }
            
            if (isMounted) {
                if (player) playerRef.current = player;
            } else {
                if (player) player.destroy();
            }

        } catch (error) {
            console.error("Error initializing Plyr player:", error);
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
  }, [source, poster]); // Re-run only if source or poster changes.

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
    <>
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
            display: none; // Hide central play button when controls are visible
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
        `}
      </style>
      <div ref={containerRef} className="relative w-full h-full">
         {/* Plyr will be injected here */}
        {watermark && (
            <div className="plyr__watermark">
                <img src={watermark} alt="Watermark" />
            </div>
        )}
      </div>
    </>
  );
});

PlyrPlayer.displayName = 'PlyrPlayer';
export default PlyrPlayer;
