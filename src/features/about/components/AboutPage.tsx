
'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { memo, useRef } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import Image from 'next/image';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import Preloader from '@/components/preloader';
import { cn } from '@/lib/utils';

interface Client {
  id: string;
  name: string;
  logoUrl: string;
  order: number;
}

const MemoizedImage = memo(Image);

export default function AboutPage() {
  const plugin = useRef(
    Autoplay({ delay: 2000, stopOnInteraction: false, stopOnMouseEnter: true })
  );
  const isMobile = useIsMobile();
  const firestore = useFirestore();

  const clientsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'clients'), orderBy('order')) : null,
    [firestore]
  );
  const { data: clients, isLoading } = useCollection<Client>(clientsQuery);

  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-[5%] pb-4">
        <div className="container mx-auto px-0">
            <div className="mb-8 text-center">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">About Us</h1>
              <p className="mt-2 max-w-2xl mx-auto text-base md:text-lg text-foreground/70">
                Trusted by leading artists and brands from around the world.
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
            <div className="w-full max-w-sm md:max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold tracking-tight text-center mb-8">Our Clients</h2>
              <Carousel
                plugins={[plugin.current]}
                opts={{
                  align: 'start',
                  loop: true,
                }}
                orientation={isMobile ? 'vertical' : 'horizontal'}
                className="w-full"
              >
                <CarouselContent className={isMobile ? '-mt-4 h-48' : '-ml-4'}>
                  {(clients && clients.length > 0) ? clients.map((client) => (
                    <CarouselItem key={client.id} className={isMobile ? 'pt-4 basis-1/2' : 'basis-1/3'}>
                      <div className="p-1 h-full flex flex-col items-center justify-center gap-4 group cursor-pointer">
                         <div className="relative w-[150px] h-[40px]">
                           <MemoizedImage 
                             src={client.logoUrl} 
                             alt={`${client.name} logo`}
                             fill
                             className="object-contain w-full h-10 invert brightness-0 transition-all duration-300 group-hover:filter-none"
                             style={{ filter: 'grayscale(1) brightness(1.5)' }}
                           />
                         </div>
                         <p className="text-sm text-white whitespace-nowrap transition-colors duration-300 group-hover:text-primary">{client.name}</p>
                      </div>
                    </CarouselItem>
                  )) : (
                    <CarouselItem>
                      <div className="p-1 h-full flex items-center justify-center text-muted-foreground">
                        No clients to display.
                      </div>
                    </CarouselItem>
                  )}
                </CarouselContent>
              </Carousel>

              <div className="text-center mt-8 md:mt-12">
                <p className="text-foreground/70">
                  Trusted by 1000+ amazing clients worldwide
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
