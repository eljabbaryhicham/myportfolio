
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import dynamic from 'next/dynamic';
import Preloader from "@/components/preloader";
import { defaultPortfolioItems } from "../data/portfolio-data";

const VideoPlayer = dynamic(() => import('@/components/video-player'), {
  ssr: false,
  loading: () => <div className="aspect-video w-full flex items-center justify-center bg-black"><Preloader /></div>,
});

export default function HomePage() {
  const featuredVideo = defaultPortfolioItems.find(item => item.type === 'video' && item.featured);
  
  const videoSource = featuredVideo?.sources 
    ? {
        type: 'video' as const,
        sources: featuredVideo.sources.map(s => ({ src: s.src, size: s.size, type: 'video/mp4' })),
      }
    : {
        type: 'video' as const,
        sources: [{ src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4', type: 'video/mp4' }]
      };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-8">
      <div className="w-full h-1/2 relative rounded-lg overflow-hidden glass-effect border border-border/50">
        <VideoPlayer 
            source={videoSource}
            poster={featuredVideo?.thumbnailUrl}
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
