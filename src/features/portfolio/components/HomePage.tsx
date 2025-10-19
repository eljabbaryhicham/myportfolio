
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
import VideoPlayer from "@/components/video-player";
import type { SourceInfo } from "plyr";
import Logo from "@/components/logo";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

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

  const videoSource = useMemo(() => {
    const project = featuredProject || defaultPortfolioItems.find(item => item.featured && item.type === 'video');
    if (!project) return null;

    let sourceInfo: SourceInfo;
    if (project.sources && project.sources.length > 0) {
      sourceInfo = {
        type: 'video',
        sources: project.sources.map(s => ({ src: s.src, type: 'video/mp4', size: s.size })),
      };
    } else if (project.sourceUrl) {
      sourceInfo = {
        type: 'video',
        sources: [{ src: project.sourceUrl }],
      };
    } else {
      return null;
    }
    return sourceInfo;
  }, [featuredProject]);
  
  const logoUrl = contactInfo?.logoUrl || "https://i.imgur.com/N9c8oEJ.png";

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-8 p-4">
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
  );
}
