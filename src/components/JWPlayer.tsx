
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Preloader from './preloader';
import { cn } from '@/lib/utils';

declare global {
    interface Window {
        jwplayer: any;
    }
}

interface JWPlayerProps {
  source: string;
  poster?: string;
  autoPlay?: boolean;
  libraryUrl: string;
}

const JWPlayer = ({ source, poster, autoPlay = true, libraryUrl }: JWPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const playerInstance = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;
    const container = containerRef.current;
    if (!container || !libraryUrl) {
      setIsLoading(false);
      return;
    }

    const loadScript = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        const scriptId = 'jwplayer-script';
        if (document.getElementById(scriptId)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = libraryUrl;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load JW Player script'));
        document.head.appendChild(script);
      });
    };

    const initPlayer = async () => {
      try {
        await loadScript();
        if (!isMounted || !container) return;

        if (playerInstance.current) {
          playerInstance.current.remove();
          playerInstance.current = null;
        }
        container.innerHTML = '';

        const player = window.jwplayer(container).setup({
          file: source,
          image: poster || undefined,
          width: '100%',
          height: '100%',
          autostart: autoPlay,
          controls: true,
          primary: 'html5',
        });

        player.on('ready', () => { if (isMounted) setIsLoading(false); });
        player.on('error', () => { if (isMounted) setIsLoading(false); });
        player.on('setupError', () => { if (isMounted) setIsLoading(false); });

        playerInstance.current = player;
      } catch (e) {
        console.error('JWPlayer init error:', e);
        if (isMounted) setIsLoading(false);
      }
    };

    initPlayer();

    return () => {
      isMounted = false;
      if (playerInstance.current) {
        try { playerInstance.current.remove(); } catch {}
        playerInstance.current = null;
      }
    };
  }, [source, poster, autoPlay, libraryUrl]);

  if (!libraryUrl) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-black text-white/50 text-sm">
        JW Player library URL not configured
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 pointer-events-none">
          <Preloader />
        </div>
      )}
      <div
        ref={containerRef}
        className={cn("w-full h-full", isLoading ? 'opacity-0' : 'opacity-100')}
      />
    </div>
  );
};

export default JWPlayer;
