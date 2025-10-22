
'use client';

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import 'shaka-player/dist/controls.css';
import Preloader from './preloader';

// Custom Download Button for Shaka Player
class DownloadButton extends window.shaka.ui.Element {
  private button_: HTMLButtonElement;

  constructor(parent: HTMLElement, controls: shaka.ui.Controls) {
    super(parent, controls);

    this.button_ = document.createElement('button');
    this.button_.className = 'shaka-download-button shaka-control-button';
    this.button_.innerHTML = '<i class="material-icons">download</i>'; // Using Material Icons font
    this.button_.setAttribute('aria-label', 'Download');
    this.parent.appendChild(this.button_);

    this.eventManager.listen(this.button_, 'click', () => {
      this.onDownloadClick_();
    });
  }

  private onDownloadClick_() {
    const assetUri = this.player.getAssetUri();
    if (assetUri) {
      const link = document.createElement('a');
      link.href = assetUri;
      
      // Try to get a nice filename
      try {
        const url = new URL(assetUri);
        link.download = url.pathname.split('/').pop() || 'video';
      } catch (e) {
        link.download = 'video';
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // This is required by the shaka.extern.IUIElement interface.
  release() {
    super.release();
  }
}

DownloadButton.Factory = class {
  create(rootElement: HTMLElement, controls: shaka.ui.Controls) {
    return new DownloadButton(rootElement, controls);
  }
};


interface VideoPlayerProps {
  src?: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  preloadManager?: shaka.media.PreloadManager; // Accept a preload manager
}

const VideoPlayer = ({
  src,
  poster,
  className,
  autoPlay = false,
  muted = false,
  loop = false,
  controls = true,
  preloadManager,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isBuffering, setIsBuffering] = useState(true);

  useEffect(() => {
    if (!videoRef.current || !containerRef.current) return;

    let player: shaka.Player | null = null;
    let ui: shaka.ui.Overlay | null = null;

    const initPlayer = async () => {
        const shaka = await import('shaka-player/dist/shaka-player.ui');
        shaka.polyfill.installAll();
        if (!shaka.Player.isBrowserSupported()) {
            console.error('Browser not supported!');
            return;
        }

        // Register the custom button. It's safe to call this multiple times.
        shaka.ui.Controls.registerElement('download', new DownloadButton.Factory());
        
        player = new shaka.Player(videoRef.current);

        // Add buffering event listeners
        player.addEventListener('buffering', (e) => {
            setIsBuffering(e.buffering);
        });
        
        if (videoRef.current) {
            videoRef.current.volume = 0.10;
        }

        if (controls) {
            ui = new shaka.ui.Overlay(player, containerRef.current, videoRef.current);
            const uiConfig: shaka.extern.UIConfiguration = {
                showUnbufferedStart: false,
                seekBarColors: {
                    base: 'rgba(255, 255, 255, 0.2)',
                    buffered: 'rgba(255, 255, 255, 0.4)',
                    played: 'hsl(var(--primary))',
                },
                volumeBarColors: {
                    base: 'rgba(255, 255, 255, 0.2)',
                    level: 'hsl(var(--primary))',
                },
                controlPanelElements: [
                    'play_pause',
                    'time_and_duration',
                    'spacer',
                    'volume',
                    'fullscreen',
                    'download', // Add the download button here
                    'overflow_menu',
                ],
                overflowMenuButtons: ['quality', 'picture_in_picture', 'loop', 'captions', 'playback_rate'],
            };
            ui.configure(uiConfig);
        }

        const onError = (error: any) => {
            console.error('Error code', error.code, 'object', error);
        }
        
        player.addEventListener('error', onError);

        player.configure({
            drm: {
                servers: {},
                clearKeys: {}
            }
        });

        try {
            if (preloadManager) {
                await player.load(preloadManager);
            } else if (src) {
                await player.load(src);
            }
        } catch (e) {
            onError(e);
        }
    };

    initPlayer();

    return () => {
      if (ui) {
        ui.destroy();
      }
      if (player) {
        player.destroy();
      }
    };
  }, [src, controls, preloadManager]);

  return (
    <div ref={containerRef} className={cn("relative w-full h-full bg-black", className)}>
      {isBuffering && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
          <Preloader />
        </div>
      )}
      <video
        ref={videoRef}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        className="w-full h-full"
      />
    </div>
  );
};

export default VideoPlayer;
