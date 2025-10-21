
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import type { PortfolioItem } from "../data/portfolio-data";
import { cn } from "@/lib/utils";
import Preloader from "@/components/preloader";
import { defaultPortfolioItems } from "../data/portfolio-data";
import { useMemo } from "react";
import dynamic from 'next/dynamic';
import Logo from "@/components/logo";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type Player from 'video.js/dist/types/player';

const VideoPlayer = dynamic(() => import('@/components/video-player'), { ssr: false });

interface HomePageContentProps {
    featuredProject: PortfolioItem | null;
    isLoading: boolean;
}

interface ContactInfo {
    logoUrl?: string;
}

export default function HomePageContent({ featuredProject, isLoading }: HomePageContentProps) {
  const firestore = useFirestore();

  const contactDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'contact', 'details') : null),
    [firestore]
  );
  const { data: contactInfo, isLoading: isLoadingContact } = useDoc<ContactInfo>(contactDocRef);

  const videoJsOptions = useMemo(() => {
    const project = featuredProject || defaultPortfolioItems.find(item => item.featured && item.type === 'video');
    if (!project || !project.sourceUrl) return null;

    let videoSrc = project.sourceUrl;
    let type = 'video/mp4';
    if(videoSrc.includes('res.cloudinary.com')){
        const uploadMarker = '/upload/';
        const uploadIndex = videoSrc.indexOf(uploadMarker);
        if (uploadIndex !== -1) {
            const publicIdWithTransformations = videoSrc.substring(uploadIndex + uploadMarker.length);
            const publicId = publicIdWithTransformations.split('/').slice(1).join('/');
            videoSrc = `https://res.cloudinary.com/da1srnoer/video/upload/f_hls/${publicId.replace(/\.[^/.]+$/, "")}/master.m3u8`;
            type = 'application/x-mpegURL';
        }
    }
    
    return {
      autoplay: true,
      controls: false,
      loop: true,
      muted: true,
      fluid: true,
      sources: [{
        src: videoSrc,
        type: type,
      }]
    };
  }, [featuredProject]);
  
  const logoUrl = contactInfo?.logoUrl || "https://i.imgur.com/N9c8oEJ.png";

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center gap-8 p-4 overflow-hidden">
      {(isLoading || isLoadingContact) && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background">
              <Preloader />
          </div>
      )}
      <div className={cn("absolute inset-0 z-0 transition-opacity duration-1000", (isLoading || isLoadingContact) && "opacity-0")}>
        {videoJsOptions && (
          <VideoPlayer options={videoJsOptions} />
        )}
        <div className="absolute inset-0 bg-black/50"></div>
      </div>
      <div className={cn("relative z-10 flex flex-col items-center justify-center gap-8 transition-opacity duration-1000", (isLoading || isLoadingContact) && "opacity-0")}>
        <div className="w-full max-w-sm">
          <Logo src={logoUrl} />
        </div>
        <Button asChild size="lg" className="group">
          <Link href="/work">
            Explore Work
            <FontAwesomeIcon icon={faArrowRight} className="ml-2 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
