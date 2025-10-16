
'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { memo } from 'react';

const clients = [
  {
    name: 'Komfortrauschen',
    category: 'Band',
    image: 'https://picsum.photos/seed/client1/400/400',
    hint: 'woman portrait',
  },
  {
    name: 'Alec Troniq',
    category: 'Live-Act',
    image: 'https://picsum.photos/seed/client2/400/400',
    hint: 'person singing',
  },
  {
    name: 'Anda Morts',
    category: 'Band',
    image: 'https://picsum.photos/seed/client3/400/400',
    hint: 'microphone stage',
  },
  {
    name: 'Annett Gapstream',
    category: 'DJ',
    image: 'https://picsum.photos/seed/client4/400/400',
    hint: 'dj performance',
  },
  {
    name: 'Brezel Göring & Psycho',
    category: 'Band',
    image: 'https://picsum.photos/seed/client5/400/400',
    hint: 'man portrait',
  },
  {
    name: 'Client Six',
    category: 'Solo Artist',
    image: 'https://picsum.photos/seed/client6/400/400',
    hint: 'guitar player',
  },
  {
    name: 'Client Seven',
    category: 'Band',
    image: 'https://picsum.photos/seed/client7/400/400',
    hint: 'drummer silhouette',
  },
  {
    name: 'Client Eight',
    category: 'Electronic Duo',
    image: 'https://picsum.photos/seed/client8/400/400',
    hint: 'synthesizer setup',
  },
  {
    name: 'Client Nine',
    category: 'Vocalist',
    image: 'https://picsum.photos/seed/client9/400/400',
    hint: 'woman singing',
  },
  {
    name: 'Client Ten',
    category: 'Producer',
    image: 'https://picsum.photos/seed/client10/400/400',
    hint: 'mixing board',
  },
];

const MemoizedImage = memo(Image);

export default function AboutPage() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-2xl text-foreground/80 max-w-3xl mx-auto">
            Trusted by leading artists and brands from around the world. Here
            are some of the amazing clients I've had the pleasure to work with.
          </h1>
        </div>

        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {clients.map((client, index) => (
              <CarouselItem key={index}>
                <div className="p-1">
                  <Card className="overflow-hidden glass-effect group">
                    <CardContent className="relative aspect-video p-0">
                      <MemoizedImage
                        src={client.image}
                        alt={client.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint={client.hint}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 100vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                          <Star className="h-3 w-3 mr-1" />
                          {client.category}
                        </Badge>
                      </div>
                      <div className="absolute bottom-4 left-4">
                        <h3 className="text-lg font-bold text-white">
                          {client.name}
                        </h3>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden lg:flex" />
          <CarouselNext className="hidden lg:flex" />
        </Carousel>

        <div className="text-center mt-12">
          <p className="text-foreground/70">
            Trusted by {clients.length}+ amazing clients worldwide
          </p>
        </div>
      </div>
    </div>
  );
}
