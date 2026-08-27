
'use client';

import { memo, useState, useEffect, useRef, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import Preloader from '@/components/preloader';
import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { BrainCircuit, Mic, Clapperboard, Share2, Code } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollIndicator } from '@/components/ScrollIndicator';
import { useTranslation } from '@/lib/i18n/useTranslation';


interface Client {
  id: string;
  name: string;
  logoUrl: string;
  order: number;
  isVisible?: boolean;
}

interface AboutPageContent {
    title: string;
    content: string;
    imageUrl: string;
    logoUrl?: string;
    logoScale?: number;
}

const services = [
    { key: "about.services.brainstorming", icon: BrainCircuit },
    { key: "about.services.voiceover", icon: Mic },
    { key: "about.services.contentCreation", icon: Clapperboard },
    { key: "about.services.socialMedia", icon: Share2 },
    { key: "about.services.webDesign", icon: Code },
];


const MemoizedImage = memo(Image);

function cloudinaryOptimized(url: string) {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  if (url.includes('f_auto')) return url;
  return url.replace('/upload/', '/upload/f_auto,q_auto/');
}

const ClientLogo = ({ client }: { client: Client }) => (
    <div 
      className="relative mx-8 flex-shrink-0 basis-1/5 group"
    >
        <MemoizedImage
            src={cloudinaryOptimized(client.logoUrl)}
            alt={client.name}
            width={128}
            height={40}
            sizes="128px"
            loading="lazy"
            className="object-contain h-10 w-32 grayscale brightness-0 invert transition-all duration-300 group-hover:grayscale-0 group-hover:brightness-100 group-hover:invert-0"
        />
    </div>
);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};

export default function AboutPage() {
  const firestore = useFirestore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const clientsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'clients'), orderBy('order')) : null,
    [firestore]
  );
  const { data: allClients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);

  const settingsDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
    [firestore]
  );
  const { data: pageSettings } = useDoc<Record<string, string>>(settingsDocRef);
  
  const aboutContentRef = useMemoFirebase(
    () => firestore ? doc(firestore, 'about', 'content') : null,
    [firestore]
  );
  const { data: aboutContent, isLoading: isLoadingContent } = useDoc<AboutPageContent>(aboutContentRef);
  
  const clients = useMemo(() => allClients?.filter(c => c.isVisible !== false) || [], [allClients]);

  const isLoading = isLoadingClients || isLoadingContent;
  const logoUrl = aboutContent?.logoUrl;
  const logoScale = aboutContent?.logoScale || 1;
  
  const [emblaRef] = useEmblaCarousel({ loop: true, align: 'start' }, [
    Autoplay({
      delay: 1000,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    }),
  ])
  
  const duplicatedClients = useMemo(() => {
    if (clients && clients.length > 0) {
      return [...clients, ...clients];
    }
    return [];
  }, [clients]);

  return (
    <div className="h-full w-full flex flex-col">
      {!isLoading && <ScrollIndicator scrollRef={scrollRef} />}
      <div className="p-4 md:p-8 flex-shrink-0">
        <div className="container mx-auto px-0">
            <div className="mb-[clamp(1rem,3vh,2rem)] text-center">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline tracking-tight">{pageSettings?.aboutHeading || t('about.heading')}</h1>
              <p className="mt-2 max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-foreground/70">
                {pageSettings?.aboutSubtitle || t('about.subtitle')}
              </p>
            </div>
        </div>
      </div>
      <Separator className="bg-white/10 flex-shrink-0" />
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-[clamp(1rem,3vh,2rem)] md:p-[clamp(1.5rem,4vh,2rem)] flex items-center justify-center min-h-full">
          <div className="container mx-auto px-0 text-center">
            {isLoadingContent ? (
              <div className="flex justify-center items-center h-[50vh]">
                <Preloader />
              </div>
            ) : (
              <motion.div 
                  className="space-y-[clamp(2rem,6vh,4rem)]"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                <motion.div 
                    variants={itemVariants}
                    className="flex flex-col gap-[clamp(1.5rem,4vh,3rem)] items-center justify-center lg:flex-row lg:items-stretch"
                  >
                    <div className="w-full lg:w-1/2 text-center p-4 sm:p-6 md:p-8 flex flex-col justify-center">
                        {logoUrl && (
                            <div className="w-32 mx-auto mb-4" style={{ transform: `scale(${logoScale})` }}>
                                <Logo src={logoUrl} />
                            </div>
                        )}
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-headline tracking-tight mb-[clamp(0.75rem,2vh,1.25rem)]">{aboutContent?.title}</h2>
                        <p className="text-sm sm:text-base text-foreground/70 leading-relaxed mb-[clamp(1rem,2.5vh,1.75rem)] text-center">{aboutContent?.content}</p>
                        <div className="hidden sm:flex flex-col sm:flex-row gap-4 justify-center">
                            <Button asChild>
                                <Link href="/contact">
                                    <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                                    {t('about.cta.contact')}
                                </Link>
                            </Button>
                            <Button asChild variant="destructive">
                                 <Link href="/work">
                                    {t('about.cta.explore')}
                                    <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                    <div className="w-full lg:w-1/2 flex flex-col justify-center">
                       <h2 className="text-2xl md:text-3xl font-headline tracking-tight mb-[clamp(1rem,3vh,1.75rem)] text-center">{t('about.whatYouGet')}</h2>
                       <div className="grid grid-cols-3 sm:grid-cols-6 grid-rows-2 auto-rows-fr gap-[clamp(0.75rem,2vh,1.25rem)] h-full">
                        {services.map((service, index) => {
                            let gridClasses = '';
                            switch(index) {
                                case 0: gridClasses = 'col-span-3 sm:col-span-2'; break;
                                case 1: gridClasses = 'col-span-3 sm:col-span-2'; break;
                                case 2: gridClasses = 'col-span-3 sm:col-span-2'; break;
                                case 3: gridClasses = 'col-span-3'; break;
                                case 4: gridClasses = 'col-span-3'; break;
                            }
                            return (
                                <div 
                                    key={service.key}
                                    className={cn(
                                      "glass-effect p-[clamp(1rem,2.5vh,1.5rem)] rounded-lg flex flex-col items-center justify-center text-center",
                                      gridClasses
                                    )}
                                >
                                    <service.icon className="w-[clamp(2rem,4.5vh,2.5rem)] h-[clamp(2rem,4.5vh,2.5rem)] text-primary mb-[clamp(0.5rem,1.5vh,0.875rem)]" />
                                    <p className="text-xs md:text-sm font-semibold">{t(service.key)}</p>
                                </div>
                            );
                        })}
                      </div>
                    </div>
                  </motion.div>

                {isLoadingClients ? (
                  <motion.div variants={itemVariants} className="flex justify-center items-center min-h-[20vh]">
                    <Preloader />
                  </motion.div>
                ) : (
                <motion.div variants={itemVariants}>
                  <div className="text-center mb-[clamp(1.5rem,4vh,2rem)]">
                    <h2 className="text-2xl font-headline tracking-tight">{t('about.ourClients')}</h2>
                    <Separator className="bg-white/10 max-w-xs mx-auto mt-2" />
                  </div>
                  
                  {duplicatedClients && duplicatedClients.length > 0 ? (
                    <div className="w-[80vw] mx-auto overflow-hidden" ref={emblaRef}>
                      <div className="flex">
                        {duplicatedClients.map((client, index) => (
                          <div key={`${client.id}-${index}`} className="flex-shrink-0 flex-grow-0 basis-1/2 md:basis-1/3 lg:basis-1/5">
                            <ClientLogo client={client} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-1 h-full flex items-center justify-center text-muted-foreground col-span-full">
                        {t('about.clientsEmpty')}
                    </div>
                  )}
                  
                  <div className="text-center mt-[clamp(1.5rem,4vh,3rem)]">
                    <p className="text-foreground/70">
                      {t('about.clientsTagline')}
                    </p>
                  </div>
                </motion.div>
                )}

                <motion.div variants={itemVariants} className="sm:hidden flex flex-col sm:flex-row gap-4 justify-center w-full">
                    <Button asChild>
                        <Link href="/contact">
                            <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                            {t('about.cta.contact')}
                        </Link>
                    </Button>
                    <Button asChild variant="destructive">
                            <Link href="/work">
                            {t('about.cta.explore')}
                            <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                        </Link>
                    </Button>
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

    