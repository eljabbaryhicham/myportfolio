
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import dynamic from 'next/dynamic';
import Preloader from "@/components/preloader";
import { useRef, useEffect } from "react";
import Plyr from "plyr";
import 'plyr-react/plyr.css';


const VideoPlayer = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerRef = useRef<Plyr | null>(null);

    useEffect(() => {
        if (videoRef.current) {
            const player = new Plyr(videoRef.current, {
                controls: [],
                autoplay: true,
                muted: true,
                loop: { active: true },
                clickToPlay: false,
                tooltips: { controls: false, seek: false },
            });
            playerRef.current = player;
        }

        return () => {
            playerRef.current?.destroy();
        };
    }, []);

    return (
        <video 
            ref={videoRef}
            className="w-full h-full object-cover"
            src="https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4" 
            playsInline
        />
    );
};


export default function HomePage() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-8">
      <div className="w-full h-1/2 relative rounded-lg overflow-hidden glass-effect border border-border/50">
        <VideoPlayer />
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
