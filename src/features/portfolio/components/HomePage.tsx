
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { H5Player } from 'h5player';
import { useEffect, useState } from 'react';

export default function HomePage() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-8">
      <div className="w-full h-1/2 relative rounded-lg overflow-hidden glass-effect border border-border/50">
        {isClient && (
            <H5Player
                source="https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4"
                className="w-full h-full"
                config={{
                    isLive: false,
                    autoplay: true,
                    muted: true,
                    loop: true,
                    fluid: true,
                    'x5-video-player-fullscreen': false,
                    'x5-playsinline': true,
                    playsinline: true,
                    'x-webkit-airplay': false,
                    'airplay-fullscreen': false,
                    controls: false, // hide controls
                    ignores: ['error', 'volume', 'playbackrate', 'play'],
                }}
            />
        )}
      </div>
      <Button asChild size="lg" className="group">
        <Link href="/work">
          Explore Work
          <FontAwesomeIcon icon={faArrowRight} className="ml-2 transition-transform group-hover:translate-x-1" />
        </Link>
      </Button>
    </div>
  );
}
