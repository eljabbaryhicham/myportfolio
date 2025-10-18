
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import dynamic from 'next/dynamic';
import Preloader from "@/components/preloader";

// Use dynamic import to ensure the player is only loaded on the client side.
const H5Player = dynamic(() => import('h5player').then(mod => mod.H5Player), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center"><Preloader /></div>
});


export default function HomePage() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-8">
      <div className="w-full h-1/2 relative rounded-lg overflow-hidden glass-effect border border-border/50">
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
