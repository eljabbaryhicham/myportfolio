
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { defaultPortfolioItems } from "../data/portfolio-data";
import H5Player from "./H5Player";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const featuredVideo = defaultPortfolioItems.find(item => item.type === 'video' && item.featured);
  
  const videoSrc = featuredVideo?.sources?.find(s => s.size === 1080)?.src 
    || featuredVideo?.sources?.[0]?.src 
    || 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-1080p.mp4';

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-8 p-4">
      <div className={cn(
        "w-full max-w-4xl aspect-video", // Use aspect-video for 16:9 ratio
        "relative rounded-lg overflow-hidden glass-effect border border-border/50"
      )}>
        <H5Player source={videoSrc} />
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
