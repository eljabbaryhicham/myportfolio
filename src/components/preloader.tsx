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

// Fixed pixel size used by inline (non-fullscreen) preloaders so the chosen
// animation renders at the same, clearly-visible size on every page/media
// loader regardless of how small the containing card is. Without this, the
// viewport-relative `preloaderSize` (%) collapses to a tiny spinner on cards.
const INLINE_SIZE_PX = 64;

// Resolve the CSS dimensions for the animation element. Fullscreen loaders
// size relative to the viewport (%) so the homepage loader keeps its
// prominent size; inline loaders use a fixed pixel size for consistency.
const resolveDimension = (sizePct: number, fullscreen: boolean): string =>
  fullscreen ? `${sizePct}%` : `${INLINE_SIZE_PX}px`;

const DimensionStyle = ({ dimension }: { dimension: string }) => ({
  width: dimension,
  height: dimension,
  maxWidth: dimension,
  maxHeight: dimension,
});

const DefaultLottie = ({ url, size }: { url?: string; size: string }) => {
  const [lottieData, setLottieData] = useState<any>(null);
  const [, setLoading] = useState(true);

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
        <div style={DimensionStyle({ dimension: size })}>
          <LazyLottie animationData={lottieData} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full h-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={FALLBACK_GIF} alt="Loading" style={DimensionStyle({ dimension: size })} className="object-contain" />
    </div>
  );
};

const GifLoader = ({ url, size }: { url: string; size: string }) => {
  return (
    <div className="flex items-center justify-center w-full h-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Loading" style={DimensionStyle({ dimension: size })} className="object-contain" />
    </div>
  );
};

const WebmLoader = ({ url, size }: { url: string; size: string }) => {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <video
        src={url}
        autoPlay
        loop
        muted
        playsInline
        style={DimensionStyle({ dimension: size })}
        className="object-contain"
      />
    </div>
  );
};

const Preloader = ({ settings, fullscreen = false }: { settings?: PreloaderSettings; fullscreen?: boolean }) => {
  const fromContext = usePreloaderSettingsFromContext();
  const active = settings || fromContext || cachedSettings;

  const type = active?.preloaderType || 'default';
  const url = active?.preloaderUrl || '';
  const sizePct = active?.preloaderSize || 15;
  const dimension = resolveDimension(sizePct, fullscreen);

  if (type === 'gif' && url) return <GifLoader url={url} size={dimension} />;
  if (type === 'webm' && url) return <WebmLoader url={url} size={dimension} />;
  return <DefaultLottie url={url || undefined} size={dimension} />;
};

export default Preloader;
