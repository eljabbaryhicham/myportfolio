
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import type { PortfolioItem } from "../data/portfolio-data";
import { cn } from "@/lib/utils";
import Preloader from "@/components/preloader";
import Logo from "@/components/logo";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import SmoothVideo from "@/components/video-player";

interface HomePageContentProps {
    backgroundVideo: PortfolioItem | null;
    isLoading: boolean;
}

interface ContactInfo {
    logoUrl?: string;
}

export default function HomePageContent({ backgroundVideo, isLoading }: HomePageContentProps) {
  const firestore = useFirestore();

  const contactDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'contact', 'details') : null),
    [firestore]
  );
  const { data: contactInfo, isLoading: isLoadingContact } = useDoc<ContactInfo>(contactDocRef);
  
  const logoUrl = contactInfo?.logoUrl || "https://i.imgur.com/N9c8oEJ.png";
  const videoSrc = backgroundVideo?.sourceUrl;

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center gap-8 p-4">
      {(isLoading || isLoadingContact) && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50">
              <Preloader />
          </div>
      )}
      
      {videoSrc && (
        <div className="absolute inset-0 -z-10 w-full h-full">
            <SmoothVideo
                src={videoSrc}
                autoPlay
                loop
                muted
                className="w-full h-full object-cover"
            />
        </div>
      )}


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
