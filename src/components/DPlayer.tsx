
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Preloader from './preloader';
import { cn } from '@/lib/utils';

declare global {
    interface Window {
        DPlayer: any;
    }
}

interface DPlayerProps {
  source: string;
  poster?: string;
  autoPlay?: boolean;
}

const loadCss = (href: string, id: string): Promise<void> => {
    return new Promise((resolve) => {
        if (document.getElementById(id)) { resolve(); return; }
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = () => resolve();
        link.onerror = () => resolve();
        document.head.appendChild(link);
    });
};

const loadScript = (src: string, id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (document.getElementById(id)) { resolve(); return; }
        const script = document.createElement('script');
        script.id = id;
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load DPlayer script'));
        document.head.appendChild(script);
    });
};

const DPlayer = ({ source, poster, autoPlay = true }: DPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const container = containerRef.current;
      if (!container) return;

      try {
        await loadCss('https://cdn.jsdelivr.net/npm/dplayer@1.26.0/dist/DPlayer.min.css', 'dplayer-css');
        await loadScript('https://cdn.jsdelivr.net/npm/dplayer@1.26.0/dist/DPlayer.min.js', 'dplayer-js');
        if (!isMounted || !container) return;

        if (playerRef.current) {
          playerRef.current.destroy();
          playerRef.current = null;
        }
        container.innerHTML = '';

        const player = new window.DPlayer({
          container,
          video: {
            url: source,
            pic: poster || undefined,
          },
          autoplay: autoPlay,
          theme: '#d81e38',
          volume: 0.7,
          screenshot: false,
          airplay: true,
        });

        player.on('error', () => { if (isMounted) setIsLoading(false); });
        setIsLoading(false);
        playerRef.current = player;
      } catch (e) {
        console.error('DPlayer init error:', e);
        if (isMounted) setIsLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
    };
  }, [source, poster, autoPlay]);

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

export default DPlayer;
