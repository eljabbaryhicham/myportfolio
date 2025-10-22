
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import Plyr from 'plyr-react';
import 'plyr-react/plyr.css';
import Preloader from './preloader';

interface VideoPlayerProps {
  src?: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

const VideoPlayer = ({
  src,
  poster,
  className,
  autoPlay = false,
  muted = false,
  loop = false,
}: VideoPlayerProps) => {

  if (!src) {
    return <div className="w-full h-full flex items-center justify-center bg-black"><Preloader /></div>;
  }

  const plyrSource = {
    type: 'video',
    sources: [
      {
        src: src,
      },
    ],
    poster: poster,
  } as Plyr.SourceInfo;

  const plyrOptions: Plyr.Options = {
    controls: [
      'play-large',
      'play',
      'progress',
      'current-time',
      'mute',
      'volume',
      'fullscreen',
    ],
    autoplay: autoPlay,
    muted: muted,
    loop: { active: loop },
    playsinline: true,
  };

  return (
    <div className={cn("relative w-full h-full bg-black overflow-hidden [&>div]:h-full", className)}>
        <Plyr source={plyrSource} options={plyrOptions} />
    </div>
  );
};

export default VideoPlayer;
