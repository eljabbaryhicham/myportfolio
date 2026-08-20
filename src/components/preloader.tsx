'use client';

import { useEffect, useState, useRef } from 'react';
import Lottie from 'lottie-react';
import animationData from '@/lib/preloader-animation.json';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

interface PreloaderSettings {
  preloaderType?: 'default' | 'lottie' | 'gif' | 'webm';
  preloaderUrl?: string;
}

let cachedSettings: PreloaderSettings | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30000;

const DefaultLottie = ({ url }: { url?: string }) => {
  const [lottieData, setLottieData] = useState<any>(url ? null : animationData);

  useEffect(() => {
    if (!url) return;
    let disposed = false;
    fetch(url)
      .then(r => r.json())
      .then(data => { if (!disposed) setLottieData(data); })
      .catch(() => {});
    return () => { disposed = true; };
  }, [url]);

  if (!lottieData) return null;

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="w-1/4 h-1/4">
        <Lottie animationData={lottieData} loop={true} />
      </div>
    </div>
  );
};

const GifLoader = ({ url }: { url: string }) => (
  <div className="flex items-center justify-center w-full h-full">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={url} alt="Loading" className="max-w-[25%] max-h-[25%] object-contain" />
  </div>
);

const WebmLoader = ({ url }: { url: string }) => (
  <div className="flex items-center justify-center w-full h-full">
    <video
      src={url}
      autoPlay
      loop
      muted
      playsInline
      className="max-w-[25%] max-h-[25%] object-contain"
    />
  </div>
);

const Preloader = ({ settings }: { settings?: PreloaderSettings }) => {
  const firestore = useFirestore();
  const [resolved, setResolved] = useState<PreloaderSettings | null>(
    settings || cachedSettings
  );

  const settingsDocRef = useMemoFirebase(
    () => firestore ? doc(firestore, 'homepage', 'settings') : null,
    [firestore]
  );
  const { data: remoteSettings } = useDoc<PreloaderSettings>(settingsDocRef);

  useEffect(() => {
    if (settings) {
      setResolved(settings);
      return;
    }
    if (remoteSettings) {
      const s = { preloaderType: remoteSettings.preloaderType, preloaderUrl: remoteSettings.preloaderUrl };
      cachedSettings = s;
      cacheTimestamp = Date.now();
      setResolved(s);
    }
  }, [settings, remoteSettings]);

  if (!resolved) return null;

  const type = resolved.preloaderType || 'default';
  const url = resolved.preloaderUrl || '';

  if (type === 'gif' && url) return <GifLoader url={url} />;
  if (type === 'webm' && url) return <WebmLoader url={url} />;
  if (type === 'lottie') return <DefaultLottie url={url || undefined} />;
  return <DefaultLottie />;
};

export default Preloader;
