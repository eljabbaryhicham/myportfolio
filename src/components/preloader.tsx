'use client';

import { useEffect, useState, useContext } from 'react';
const FALLBACK_GIF = 'https://res.cloudinary.com/dsq1lxrqi/image/upload/f_auto,q_auto/v1787348899/honey_badger_alive__gyx22e.gif';
import { HomePageSettingsContext } from '@/components/settings/home-page-settings-provider';
import type { HomePageSettings } from '@/lib/types';

interface PreloaderSettings {
  preloaderType?: 'default' | 'lottie' | 'gif' | 'webm';
  preloaderUrl?: string;
  preloaderSize?: number;
}

let cachedSettings: PreloaderSettings | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30000;

function usePreloaderSettingsFromContext(): PreloaderSettings | null {
  const ctx = useContext(HomePageSettingsContext);
  if (!ctx) return null;
  const settings = ctx.settings as (HomePageSettings & PreloaderSettings) | null;
  if (!settings) return null;
  return {
    preloaderType: settings.preloaderType,
    preloaderUrl: settings.preloaderUrl,
    preloaderSize: settings.preloaderSize,
  };
}

// Lazy-load lottie-react (~300 KB) only when a Lottie animation is actually
// rendered, keeping the default GIF/preloader path lightweight.
const LazyLottie = ({ animationData }: { animationData: any }) => {
  const [LottieComp, setLottieComp] = useState<any>(null);
  useEffect(() => {
    let cancelled = false;
    import('lottie-react').then((mod) => { if (!cancelled) setLottieComp(() => mod.default); });
    return () => { cancelled = true; };
  }, []);
  if (!LottieComp) return null;
  return <LottieComp animationData={animationData} loop={true} />;
};

const DefaultLottie = ({ url, size }: { url?: string; size?: number }) => {
  const [lottieData, setLottieData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pct = size || 15;

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }
    let disposed = false;
    setLoading(true);
    fetch(url)
      .then(r => r.json())
      .then(data => { if (!disposed) { setLottieData(data); setLoading(false); } })
      .catch(() => { if (!disposed) setLoading(false); });
    return () => { disposed = true; };
  }, [url]);

  if (lottieData) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div style={{ width: `${pct}%`, height: `${pct}%` }}>
          <LazyLottie animationData={lottieData} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full h-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={FALLBACK_GIF} alt="Loading" style={{ width: `${pct}%`, height: `${pct}%`, maxWidth: `${pct}%`, maxHeight: `${pct}%` }} className="object-contain" />
    </div>
  );
};

const GifLoader = ({ url, size }: { url: string; size?: number }) => {
  const pct = size || 15;
  return (
    <div className="flex items-center justify-center w-full h-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Loading" style={{ width: `${pct}%`, height: `${pct}%`, maxWidth: `${pct}%`, maxHeight: `${pct}%` }} className="object-contain" />
    </div>
  );
};

const WebmLoader = ({ url, size }: { url: string; size?: number }) => {
  const pct = size || 15;
  return (
    <div className="flex items-center justify-center w-full h-full">
      <video
        src={url}
        autoPlay
        loop
        muted
        playsInline
        style={{ width: `${pct}%`, height: `${pct}%`, maxWidth: `${pct}%`, maxHeight: `${pct}%` }}
        className="object-contain"
      />
    </div>
  );
};

const Preloader = ({ settings }: { settings?: PreloaderSettings }) => {
  const fromContext = usePreloaderSettingsFromContext();
  const active = settings || fromContext || cachedSettings;

  const type = active?.preloaderType || 'default';
  const url = active?.preloaderUrl || '';
  const size = active?.preloaderSize || 15;

  if (type === 'gif' && url) return <GifLoader url={url} size={size} />;
  if (type === 'webm' && url) return <WebmLoader url={url} size={size} />;
  if (type === 'lottie') return <DefaultLottie url={url || undefined} size={size} />;
  return <DefaultLottie url={url || undefined} size={size} />;
};

export default Preloader;
