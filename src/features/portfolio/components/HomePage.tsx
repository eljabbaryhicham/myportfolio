
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import H5Player from "@/components/H5Player";
import type { PortfolioItem } from "../data/portfolio-data";
import { cn } from "@/lib/utils";
import Preloader from "@/components/preloader";
import { defaultPortfolioItems } from "../data/portfolio-data";
import { useMemo } from "react";

interface HomePageContentProps {
    featuredProject: PortfolioItem | null;
    isLoading: boolean;
}

export default function HomePageContent({ featuredProject, isLoading }: HomePageContentProps) {
  
  const videoSrc = useMemo(() => {
    const project = featuredProject || defaultPortfolioItems.find(item => item.featured && item.type === 'video');
    if (!project) return null;
    
    if (project.sources && project.sources.length > 0) {
      // Find the highest quality source, assuming they are sorted or pick one
      return project.sources.sort((a, b) => b.size - a.size)[0].src;
    }
    return project.sourceUrl;
  }, [featuredProject]);


  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-8 p-4">
      <div className={cn(
        "w-full max-w-4xl aspect-video", 
        "relative rounded-lg overflow-hidden glass-effect border border-border/50"
      )}>
        {isLoading || !videoSrc ? (
          <Preloader /> 
        ) : (
          <H5Player 
            source={videoSrc} 
            options={{
                isLive: false,
                fluid: true,
                muted: true,
                autoplay: true,
                loop: true,
                poster: featuredProject?.thumbnailUrl,
                control: {
                  playAndPause: false,
                  progress: false,
                  volume: false,
                  fullscreen: false,
                }
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
