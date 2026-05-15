
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { MediaPlayer, MediaOutlet, MediaCommunitySkin } from '@vidstack/react';
import 'vidstack/styles/base.css';
import 'vidstack/styles/community-skin/video.css';

interface VidstackPlayerProps {
  source: string;
  poster?: string;
  autoPlay?: boolean;
  watermark?: string;
}

const VidstackPlayer = ({ source, poster, autoPlay = true }: VidstackPlayerProps) => {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const ref = useRef(true);

  useEffect(() => {
    let isMounted = true;
    ref.current = true;

    (async () => {
      try {
        const { defineCustomElements } = await import('vidstack/elements');
        await defineCustomElements();
        if (isMounted) setReady(true);
      } catch (e) {
        console.error('Failed to register Vidstack elements:', e);
        if (isMounted) setError(true);
      }
    })();

    return () => { isMounted = false; };
  }, []);

  if (error) return null;
  if (!ready) return null;

  return (
    <MediaPlayer
      src={source}
      poster={poster}
      autoPlay={autoPlay}
      playsInline
      style={{ width: '100%', height: '100%' }}
    >
      <MediaOutlet />
      <MediaCommunitySkin />
    </MediaPlayer>
  );
};

VidstackPlayer.displayName = 'VidstackPlayer';
export default VidstackPlayer;
