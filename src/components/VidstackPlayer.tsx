
'use client';

import React from 'react';
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
