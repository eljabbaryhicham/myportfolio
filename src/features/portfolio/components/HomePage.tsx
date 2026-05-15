
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { cn } from "@/lib/utils";

import Preloader from "@/components/preloader";
import Logo from "@/components/logo";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

interface ContactInfo {
    logoUrl?: string;
}

interface HomePageSettings {
    homePageLogoUrl?: string;
    isHomePageLogoVisible?: boolean;
}

export default function HomePageContent() {
  const firestore = useFirestore();

  const contactDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'contact', 'details') : null),
    [firestore]
  );
  const { data: contactInfo, isLoading: isLoadingContact } = useDoc<ContactInfo>(contactDocRef);

  const settingsDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
    [firestore]
  );
  const { data: homeSettings, isLoading: isLoadingSettings } = useDoc<HomePageSettings>(settingsDocRef);
  
  const isLoading = isLoadingContact || isLoadingSettings;

  const siteLogoUrl = contactInfo?.logoUrl;
  const homeLogoUrl = homeSettings?.homePageLogoUrl || siteLogoUrl;
  const isLogoVisible = homeSettings?.isHomePageLogoVisible ?? true;


  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center p-4">
      {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50">
              <Preloader />
          </div>
      )}

      <div className={cn("relative z-10 flex flex-col items-center justify-center gap-6 transition-opacity duration-1000", isLoading && "opacity-0")}>
        {isLogoVisible && homeLogoUrl && (
            <div className="w-full max-w-sm">
                <Logo src={homeLogoUrl} />
            </div>
        )}
        <div className="text-center space-y-3 max-w-lg">
            <h2 className="text-xl md:text-2xl font-headline tracking-tight text-white/90">
                From Concept to Screen
            </h2>
            <p className="text-sm md:text-base text-foreground/60 leading-relaxed">
                We craft compelling visual content — animation, graphics, sound, and strategy — to bring your brand&apos;s story to life.
            </p>
        </div>
        <Button asChild size="lg" className="group">
          <Link href="/work">
            Explore Work
            <FontAwesomeIcon icon={faArrowRight} className="ml-2 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
        <div className="pt-4 text-foreground/40 text-xs animate-pulse">
            Scroll to explore
        </div>
      </div>
    </div>
  );
}
