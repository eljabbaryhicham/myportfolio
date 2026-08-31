'use client';

import { useEffect, useState, useContext } from 'react';
import { HomePageSettingsContext } from '@/components/settings/home-page-settings-provider';
import type { HomePageSettings } from '@/lib/types';

export type PreloaderType = 'none' | 'gif' | 'lottie' | 'webm';

export interface PreloaderSettings {
  preloaderType?: PreloaderType;
  preloaderUrl?: string;
  preloaderSize?: number;
}

function usePreloaderSettingsFromContext(): PreloaderSettings | null {
  const ctx = useContext(HomePageSettingsContext);
  if (!ctx) return null;
  const settings = ctx.settings as (HomePageSettings & PreloaderSettings) | null;
  if (!settings) return null;
  return {
    preloaderType: settings.preloaderType as PreloaderType | undefined,
    preloaderUrl: settings.preloaderUrl,
    preloaderSize: settings.preloaderSize,
  };
}

// Lazy-load lottie-react (~300 KB) only when a Lottie animation is actually
// rendered, keeping the GIF/WebM/none paths lightweight.
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

// All loaders size relative to their container (%) so the homepage loader
// spans the full viewport while inline loaders scale with their card/page
// area — and the admin `preloaderSize` setting controls both.
const resolveDimension = (sizePct: number): string => `${sizePct}%`;

const DimensionStyle = ({ dimension }: { dimension: string }) => ({
  width: dimension,
  height: dimension,
  maxWidth: dimension,
  maxHeight: dimension,
});

const LottieLoader = ({ url, size }: { url: string; size: string }) => {
  const [lottieData, setLottieData] = useState<any>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!url) { setFailed(true); return; }
    let disposed = false;
    setFailed(false);
    fetch(url)
      .then(r => { if (!r.ok) throw new Error('bad status'); return r.json(); })
      .then(data => { if (!disposed) setLottieData(data); })
      .catch(() => { if (!disposed) setFailed(true); });
    return () => { disposed = true; };
  }, [url]);

  // On failure render nothing rather than a different (fallback) animation.
  if (failed || !lottieData) return null;

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div style={DimensionStyle({ dimension: size })}>
        <LazyLottie animationData={lottieData} />
      </div>
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

const Preloader = ({ settings }: { settings?: PreloaderSettings }) => {
  const fromContext = usePreloaderSettingsFromContext();
  const active = settings || fromContext || null;

  // Legacy 'default' (no/fallback animation) is treated as 'none'.
  const rawType = active?.preloaderType as PreloaderType | 'default' | undefined;
  const type = rawType === 'default' ? 'none' : (rawType || 'none');
  const url = active?.preloaderUrl || '';
  const sizePct = active?.preloaderSize || 20;

  if (type === 'none' || !url) return null;

  const dimension = resolveDimension(sizePct);

  if (type === 'gif') return <GifLoader url={url} size={dimension} />;
  if (type === 'webm') return <WebmLoader url={url} size={dimension} />;
  // lottie (and any unknown type) use the Lottie loader.
  return <LottieLoader url={url} size={dimension} />;
};

export default Preloader;
