
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import VideoPlayer from "@/components/video-player";
import type { PortfolioItem } from "../data/portfolio-data";
import { cn } from "@/lib/utils";
import Preloader from "@/components/preloader";
import { useMemo } from "react";
import { type SourceInfo } from "plyr";

interface HomePageContentProps {
    featuredProject: PortfolioItem | null;
    isLoading: boolean;
}

export default function HomePageContent({ featuredProject, isLoading }: HomePageContentProps) {
  
  const videoSource: SourceInfo | null = useMemo(() => {
    if (!featuredProject) return null;
    
    let sources: { src: string; type: string; size?: number }[] = [];
    if (featuredProject.sources) {
      sources = featuredProject.sources.map(s => ({
        src: s.src,
        type: 'video/mp4',
        size: s.size,
      }));
    } else if (featuredProject.sourceUrl) {
      sources.push({ src: featuredProject.sourceUrl, type: 'video/mp4' });
    }

    if (sources.length === 0) return null;

    return { type: 'video', sources };
  }, [featuredProject]);


  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-8 p-4">
      <div className={cn(
        "w-full max-w-4xl aspect-video", 
        "relative rounded-lg overflow-hidden glass-effect border border-border/50"
      )}>
        {isLoading || !videoSource ? (
          <Preloader /> 
        ) : (
          <VideoPlayer 
            source={videoSource}
            poster={featuredProject?.thumbnailUrl}
            autoplay 
            loop 
            muted 
            controls={false} 
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
