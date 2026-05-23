
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Preloader from './preloader';
import { cn } from '@/lib/utils';

declare global {
    interface Window {
        afterglow: any;
    }
}

interface AfterglowPlayerProps {
  source: string;
  poster?: string;
  autoPlay?: boolean;
}

const AFTERGLOW_CSS = 'https://cdn.jsdelivr.net/npm/afterglowplayer@3.0/dist/afterglow.min.css';
const AFTERGLOW_JS = 'https://cdn.jsdelivr.net/npm/afterglowplayer@3.0/dist/afterglow.min.js';

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
        script.onerror = () => reject(new Error('Failed to load Afterglow script'));
        document.head.appendChild(script);
    });
};

const AfterglowPlayer = ({ source, poster, autoPlay = true }: AfterglowPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        await loadCss(AFTERGLOW_CSS, 'afterglow-css');
        await loadScript(AFTERGLOW_JS, 'afterglow-js');
        if (!isMounted) return;

        if (window.afterglow) {
          window.afterglow.init();
        }

        setIsLoading(false);
      } catch (e) {
        console.error('Afterglow init error:', e);
        if (isMounted) setIsLoading(false);
      }
    };

    // Small delay to ensure DOM is ready
    setTimeout(init, 100);

    return () => { isMounted = false; };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 pointer-events-none">
          <Preloader />
        </div>
      )}
      <video
        ref={videoRef}
        className={cn("afterglow w-full h-full", isLoading ? 'opacity-0' : 'opacity-100')}
        src={source}
        poster={poster || undefined}
        autoPlay={autoPlay}
        controls
        playsInline
        data-width="100%"
        data-height="100%"
      />
    </div>
  );
};

export default AfterglowPlayer;
