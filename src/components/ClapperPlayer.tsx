
'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import ShakaPlayer from 'shaka-player-react';
import 'shaka-player/dist/controls.css';

interface ClapperPlayerProps {
  source: string;
  poster?: string;
  chromeless?: boolean;
}

const ClapperPlayer = ({ source, poster, chromeless = false }: ClapperPlayerProps) => {
  const ref = useRef(null);

  return (
    <div className={cn("w-full h-full [&>div]:h-full [&>div]:w-full", chromeless && '[&_video]:!object-cover [&_.shaka-spinner-svg]:!hidden [&_.shaka-controls-container]:!hidden')}>
        <ShakaPlayer 
            ref={ref} 
            src={source} 
            poster={poster}
            autoPlay={chromeless}
            muted={chromeless}
            loop={chromeless}
        />
    </div>
  );
};

ClapperPlayer.displayName = 'ClapperPlayer';

export default ClapperPlayer;
