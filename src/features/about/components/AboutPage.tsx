
'use client';

import { memo, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import Preloader from '@/components/preloader';
import { motion } from 'framer-motion';
import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';


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

const MemoizedImage = memo(Image);

const ClientLogo = ({ client }: { client: Client }) => (
    <div className="inline-flex flex-shrink-0 mx-4 w-36">
        <div className="group/item flex flex-col items-center justify-center gap-2 cursor-pointer p-4">
            <div className="relative w-[150px] h-[40px]">
                <MemoizedImage
                    src={client.logoUrl}
                    alt={`${client.name} logo`}
                    fill
                    className="object-contain w-full h-10 grayscale brightness-0 invert transition-all duration-300 group-hover/item:filter-none"
                />
            </div>
            <p className="text-sm text-white whitespace-nowrap transition-colors duration-300 group-hover/item:text-primary">{client.name}</p>
        </div>
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
                  className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center justify-items-center max-w-sm md:max-w-4xl mx-auto mb-12 md:mb-16"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-center md:text-left">
                    <div className="w-48 mx-auto md:mx-0 mb-4">
                        <Logo src={logoUrl} />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">{aboutContent.title}</h2>
                    <p className="text-foreground/70 leading-relaxed mb-6">{aboutContent.content}</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                        <Button asChild>
                            <Link href="/contact">
                                <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                                Contact Us
                            </Link>
                        </Button>
                        <Button asChild variant="grey">
                             <Link href="/work">
                                Explore Our Works
                                <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                            </Link>
                        </Button>
                    </div>
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
                
                {clients && clients.length > 0 ? (
                  <div className="group relative w-full overflow-hidden whitespace-nowrap">
                    <div className="flex group-hover:[animation-play-state:paused]">
                        <div className="animate-marquee flex">
                          {clients.map((client) => <ClientLogo key={client.id} client={client} />)}
                        </div>
                        <div className="animate-marquee flex" aria-hidden="true">
                          {clients.map((client) => <ClientLogo key={`${client.id}-2`} client={client} />)}
                        </div>
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
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
