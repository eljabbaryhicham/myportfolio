
'use client';

import { Card, CardContent } from '@/components/ui/card';
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

const clientLogos = [
  { name: 'QuantumLeap', logo: 'https://i.imgur.com/3yGeJkf.png' },
  { name: 'StellarForge', logo: 'https://i.imgur.com/S5a0T3b.png' },
  { name: 'ApexInnovate', logo: 'https://i.imgur.com/KzU5FmM.png' },
  { name: 'NexusCore', logo: 'https://i.imgur.com/b9x3a0D.png' },
  { name: 'VertexDynamics', logo: 'https://i.imgur.com/wRkFgdS.png' },
  { name: 'MomentumSuite', logo: 'https://i.imgur.com/wE6f6R3.png' },
];

const MemoizedImage = memo(Image);

export default function AboutPage() {
  const plugin = useRef(
    Autoplay({ delay: 2000, stopOnInteraction: true })
  );
  const isMobile = useIsMobile();

  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-[5%] pb-4">
        <div className="container mx-auto px-0">
            <div className="mb-8 text-center">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Our Clients</h1>
              <p className="mt-2 max-w-2xl mx-auto text-base md:text-lg text-foreground/70">
                Trusted by leading artists and brands from around the world.
              </p>
            </div>
        </div>
      </div>
      <Separator className="bg-white/10" />
      <ScrollArea className="flex-1">
        <div className="p-[5%] pt-4 flex flex-col items-center justify-center h-full">
          <div className="w-full max-w-sm md:max-w-2xl mx-auto">
            <Carousel
              plugins={[plugin.current]}
              opts={{
                align: 'start',
                loop: true,
              }}
              orientation={isMobile ? 'vertical' : 'horizontal'}
              className="w-full"
              onMouseEnter={plugin.current.stop}
              onMouseLeave={plugin.current.reset}
            >
              <CarouselContent className={isMobile ? '-mt-4 h-48' : '-ml-4'}>
                {clientLogos.map((client, index) => (
                  <CarouselItem key={index} className={isMobile ? 'pt-4 basis-1/2' : 'basis-1/3'}>
                    <div className="p-1 h-full">
                      <Card className="h-full glass-effect">
                        <CardContent className="flex items-center justify-center p-6 h-full">
                           <MemoizedImage 
                             src={client.logo} 
                             alt={`${client.name} logo`}
                             width={150}
                             height={50}
                             className="object-contain w-full h-full max-h-12 invert brightness-0"
                             style={{ filter: 'grayscale(1) brightness(1.5)' }}
                           />
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            <div className="text-center mt-8 md:mt-12">
              <p className="text-foreground/70">
                Trusted by 1000+ amazing clients worldwide
              </p>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
