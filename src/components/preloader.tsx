'use client';

import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
const FALLBACK_GIF = 'https://res.cloudinary.com/dsq1lxrqi/image/upload/f_auto,q_auto/v1787346242/2090900309524422657_2_h5puoc.gif';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

interface PreloaderSettings {
  preloaderType?: 'default' | 'lottie' | 'gif' | 'webm';
  preloaderUrl?: string;
  preloaderSize?: number;
}

let cachedSettings: PreloaderSettings | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30000;

const DefaultLottie = ({ url, size }: { url?: string; size?: number }) => {
  const [lottieData, setLottieData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pct = size || 25;

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
          <Lottie animationData={lottieData} loop={true} />
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
  const pct = size || 25;
  return (
    <div className="flex items-center justify-center w-full h-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Loading" style={{ width: `${pct}%`, height: `${pct}%`, maxWidth: `${pct}%`, maxHeight: `${pct}%` }} className="object-contain" />
    </div>
  );
};

const WebmLoader = ({ url, size }: { url: string; size?: number }) => {
  const pct = size || 25;
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
      const s = { preloaderType: remoteSettings.preloaderType, preloaderUrl: remoteSettings.preloaderUrl, preloaderSize: remoteSettings.preloaderSize };
      cachedSettings = s;
      cacheTimestamp = Date.now();
      setResolved(s);
    }
  }, [settings, remoteSettings]);

  const active = settings || resolved;

  const type = active?.preloaderType || 'default';
  const url = active?.preloaderUrl || '';
  const size = active?.preloaderSize || 25;

  if (type === 'gif' && url) return <GifLoader url={url} size={size} />;
  if (type === 'webm' && url) return <WebmLoader url={url} size={size} />;
  if (type === 'lottie') return <DefaultLottie url={url || undefined} size={size} />;
  return <DefaultLottie url={url || undefined} size={size} />;
};

export default Preloader;
