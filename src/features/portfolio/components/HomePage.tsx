
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import H5Player from "./H5Player";
import { defaultPortfolioItems, type PortfolioItem } from "../data/portfolio-data";
import { cn } from "@/lib/utils";
import Preloader from "@/components/preloader";

interface HomePageContentProps {
    featuredProject: PortfolioItem | null;
    isLoading: boolean;
}

export default function HomePageContent({ featuredProject, isLoading }: HomePageContentProps) {
  
  const videoSrc = featuredProject?.sources?.find(s => s.size === 1080)?.src 
    || featuredProject?.sources?.[0]?.src 
    || defaultPortfolioItems.find(item => item.featured)?.sources?.[0]?.src
    || 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-1080p.mp4';

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-8 p-4">
      <div className={cn(
        "w-full max-w-4xl aspect-video", 
        "relative rounded-lg overflow-hidden glass-effect border border-border/50"
      )}>
        {isLoading ? <Preloader /> : <H5Player source={videoSrc} />}
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
