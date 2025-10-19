
'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { memo, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import Image from 'next/image';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import Preloader from '@/components/preloader';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Client {
  id: string;
  name: string;
  logoUrl: string;
  order: number;
}

interface AboutPageContent {
    title: string;
    content: string;
    imageUrl: string;
}

const MemoizedImage = memo(Image);

export default function AboutPage() {
  const isMobile = useIsMobile();
  const firestore = useFirestore();

  const clientsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'clients'), orderBy('order')) : null,
    [firestore]
  );
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
  
  const aboutContentRef = useMemoFirebase(
    () => firestore ? doc(firestore, 'about', 'content') : null,
    [firestore]
  );
  const { data: aboutContent, isLoading: isLoadingContent } = useDoc<AboutPageContent>(aboutContentRef);

  // Duplicate clients for seamless marquee effect
  const duplicatedClients = useMemo(() => {
    if (!clients || clients.length === 0) return [];
    return [...clients, ...clients, ...clients, ...clients];
  }, [clients]);

  const isLoading = isLoadingClients || isLoadingContent;

  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-[5%] pb-4">
        <div className="container mx-auto px-0">
            <div className="mb-8 text-center">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">About Us</h1>
              <p className="mt-2 max-w-2xl mx-auto text-base md:text-lg text-foreground/70">
                Learn more about our mission and the brands we've worked with.
              </p>
            </div>
        </div>
      </div>
      <Separator className="bg-white/10" />
      <ScrollArea className="flex-1">
        <div className="p-[5%] pt-4 flex flex-col items-center justify-center min-h-full">
          {isLoading ? (
            <Preloader />
          ) : (
            <>
              {aboutContent && (
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center max-w-sm md:max-w-4xl mx-auto mb-12 md:mb-16"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-center md:text-left">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">{aboutContent.title}</h2>
                    <p className="text-foreground/70 leading-relaxed">{aboutContent.content}</p>
                  </div>
                  <div className="relative aspect-square w-full h-full rounded-lg overflow-hidden glass-effect p-2">
                    <MemoizedImage
                        src={aboutContent.imageUrl}
                        alt={aboutContent.title}
                        fill
                        className="object-cover rounded-md"
                    />
                  </div>
                </motion.div>
              )}

              <div className="w-full max-w-sm md:max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold tracking-tight">Our Clients</h2>
                  <Separator className="bg-white/10 max-w-xs mx-auto mt-2" />
                </div>
                <div className='w-full overflow-hidden'>
                  <div className="flex w-max group">
                      <div className="flex w-1/2 animate-marquee group-hover:[animation-play-state:paused]">
                          {(duplicatedClients && duplicatedClients.length > 0) ? duplicatedClients.map((client, index) => (
                          <div key={`${client.id}-${index}-1`} className="mx-8 flex flex-col items-center justify-center gap-2 cursor-pointer group/item">
                              <div className="relative w-[150px] h-[40px]">
                                <MemoizedImage 
                                    src={client.logoUrl} 
                                    alt={`${client.name} logo`}
                                    fill
                                    className="object-contain w-full h-10 invert brightness-0 transition-all duration-300 group-hover/item:filter-none"
                                    style={{ filter: 'grayscale(1) brightness(1.5)' }}
                                />
                              </div>
                              <p className="text-sm text-white whitespace-nowrap transition-colors duration-300 group-hover/item:text-primary">{client.name}</p>
                          </div>
                          )) : (
                              <div className="p-1 h-full flex items-center justify-center text-muted-foreground">
                                  No clients to display.
                              </div>
                          )}
                      </div>
                       <div className="flex w-1/2 animate-marquee group-hover:[animation-play-state:paused]">
                          {(duplicatedClients && duplicatedClients.length > 0) ? duplicatedClients.map((client, index) => (
                          <div key={`${client.id}-${index}-2`} className="mx-8 flex flex-col items-center justify-center gap-2 cursor-pointer group/item">
                              <div className="relative w-[150px] h-[40px]">
                                <MemoizedImage 
                                    src={client.logoUrl} 
                                    alt={`${client.name} logo`}
                                    fill
                                    className="object-contain w-full h-10 invert brightness-0 transition-all duration-300 group-hover/item:filter-none"
                                    style={{ filter: 'grayscale(1) brightness(1.5)' }}
                                />
                              </div>
                              <p className="text-sm text-white whitespace-nowrap transition-colors duration-300 group-hover/item:text-primary">{client.name}</p>
                          </div>
                          )) : null}
                      </div>
                  </div>
                </div>

                <div className="text-center mt-8 md:mt-12">
                  <p className="text-foreground/70">
                    Trusted by 1000+ amazing clients worldwide
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
