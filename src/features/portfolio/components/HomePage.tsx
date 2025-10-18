
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { defaultPortfolioItems } from "../data/portfolio-data";
import React, { useRef, useEffect } from 'react';
import Plyr from 'plyr';
import 'plyr-react/plyr.css';

export default function HomePage() {
  const featuredVideo = defaultPortfolioItems.find(item => item.type === 'video' && item.featured);
  
  const videoSrc = featuredVideo?.sources?.find(s => s.size === 1080)?.src 
    || featuredVideo?.sources?.[0]?.src 
    || 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-1080p.mp4';

  const videoRef = useRef<HTMLVideoElement>(null);
  
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
      return () => {
        player.destroy();
      };
    }
  }, []);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-8">
      <div className="w-full h-1/2 relative rounded-lg overflow-hidden glass-effect border border-border/50">
        <video ref={videoRef} className="plyr-react plyr" playsInline src={videoSrc}></video>
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
