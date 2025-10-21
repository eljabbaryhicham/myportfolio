
'use client';

import { memo, useState, useEffect, useRef } from 'react';
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
import { BrainCircuit, Mic, Clapperboard, Share2 } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'


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
    logoUrl?: string;
}

const services = [
    { title: "Brainstorming & Scripting", icon: BrainCircuit },
    { title: "Voiceover & Sound", icon: Mic },
    { title: "Content Creation, Animation, Video & Graphics", icon: Clapperboard },
    { title: "Social Media Management", icon: Share2 },
];


const MemoizedImage = memo(Image);

const ClientLogo = ({ client }: { client: Client }) => (
    <div 
      className="relative mx-8 flex-shrink-0 basis-1/5 group"
    >
        <MemoizedImage
            src={client.logoUrl}
            alt={`${client.name} logo`}
            width={128}
            height={40}
            className="object-contain h-10 w-32 grayscale brightness-0 invert transition-all duration-300 group-hover:grayscale-0 group-hover:brightness-100 group-hover:invert-0"
        />
    </div>
);

export default function AboutPage() {
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
  
  const isLoading = isLoadingClients || isLoadingContent;
  const logoUrl = aboutContent?.logoUrl || "https://i.imgur.com/N9c8oEJ.png";
  
  const [emblaRef] = useEmblaCarousel({ loop: true, align: 'start' }, [
    Autoplay({
      delay: 2000,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    }),
  ])

  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-[5%] pb-4 flex-shrink-0">
        <div className="container mx-auto px-0">
            <div className="mb-8 text-center">
              <h1 className="text-3xl md:text-4xl font-headline tracking-tight">About Us</h1>
              <p className="mt-2 max-w-2xl mx-auto text-base md:text-lg text-foreground/70">
                Learn more about our mission and the brands we've worked with.
              </p>
            </div>
        </div>
      </div>
      <Separator className="bg-white/10 flex-shrink-0" />
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-[5%] pt-4">
          <div className="container mx-auto px-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-full min-h-[50vh]">
                <Preloader />
              </div>
            ) : (
              <div className="space-y-12 md:space-y-24">
                <div 
                    className="flex flex-col md:flex-row gap-8 md:gap-12 items-center"
                  >
                    <div className="text-center md:text-left md:w-1/2">
                      <div className="w-48 mx-auto md:mx-0 mb-4">
                          <Logo src={logoUrl} />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-headline tracking-tight mb-4">{aboutContent?.title}</h2>
                      <p className="text-foreground/70 leading-relaxed mb-6">{aboutContent?.content}</p>
                      <div className="hidden sm:flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                          <Button asChild>
                              <Link href="/contact">
                                  <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                                  Contact Us
                              </Link>
                          </Button>
                          <Button asChild variant="success">
                               <Link href="/work">
                                  Explore Our Works
                                  <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                              </Link>
                          </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:w-1/2">
                      {services.map((service, index) => (
                          <div 
                              key={service.title}
                              className="glass-effect p-4 rounded-lg flex flex-col items-center justify-center text-center"
                          >
                              <service.icon className="w-8 h-8 md:w-10 md:h-10 text-primary mb-3" />
                              <p className="text-xs md:text-sm font-semibold">{service.title}</p>
                          </div>
                      ))}
                    </div>
                    <div className="sm:hidden flex flex-col sm:flex-row gap-4 justify-center md:justify-start w-full">
                        <Button asChild>
                            <Link href="/contact">
                                <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                                Contact Us
                            </Link>
                        </Button>
                        <Button asChild variant="success">
                             <Link href="/work">
                                Explore Our Works
                                <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                            </Link>
                        </Button>
                    </div>
                  </div>

                <div>
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-headline tracking-tight">Our Clients</h2>
                    <Separator className="bg-white/10 max-w-xs mx-auto mt-2" />
                  </div>
                  
                  {clients && clients.length > 0 ? (
                    <div className="overflow-hidden" ref={emblaRef}>
                      <div className="flex">
                        {clients.map((client) => (
                          <div key={client.id} className="flex-shrink-0 flex-grow-0 basis-1/2 md:basis-1/3 lg:basis-1/5">
                            <ClientLogo client={client} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-1 h-full flex items-center justify-center text-muted-foreground col-span-full">
                        No clients to display.
                    </div>
                  )}
                  
                  <div className="text-center mt-8 md:mt-12">
                    <p className="text-foreground/70">
                      Trusted by 1000+ amazing clients worldwide
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
