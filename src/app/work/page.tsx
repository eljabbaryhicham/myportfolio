
'use client';

import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { useState, memo, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type Plyr from 'plyr';
import { useVeryUltrawide } from '@/hooks/use-very-ultrawide';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { PortfolioItem } from '@/features/portfolio/data/portfolio-data';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpDown, faXmark, faExpand, faPalette, faFilm } from '@fortawesome/free-solid-svg-icons';
import { Separator } from '@/components/ui/separator';
import Preloader from '@/components/preloader';

const VideoPlayer = dynamic(() => import('@/components/video-player'), {
  ssr: false,
  loading: () => <div className="aspect-video w-full flex items-center justify-center bg-black"><Preloader /></div>,
});


const MemoizedImage = memo(Image);

const PortfolioMedia = ({
  item,
  onFullscreenClick,
}: {
  item: PortfolioItem;
  onFullscreenClick: (url: string) => void;
}) => {
  const [isPosterLoaded, setIsPosterLoaded] = useState(false);
  
  useEffect(() => {
    setIsPosterLoaded(false);
  }, [item.id]);

  const videoSource = useMemo(() => {
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)/;

    let sources = [];
    if (item.sourceUrl) {
      const youtubeMatch = item.sourceUrl.match(youtubeRegex);
      if (youtubeMatch?.[1]) {
        return {
          type: 'video',
          sources: [{ src: youtubeMatch[1], provider: 'youtube' }],
        };
      }

      const vimeoMatch = item.sourceUrl.match(vimeoRegex);
      if (vimeoMatch?.[1]) {
        return {
          type: 'video',
          sources: [{ src: vimeoMatch[1], provider: 'vimeo' }],
        };
      }
      sources.push({ src: item.sourceUrl, type: 'video/mp4' });
    } else if (item.sources) {
      sources = item.sources.map(s => ({
        src: s.src,
        type: 'video/mp4',
        size: s.size,
      }));
    }

    if (sources.length > 0) {
      return {
        type: 'video' as const,
        sources: sources,
      };
    }
    return null;
  }, [item]);


  if (item.type === 'video' && videoSource) {
    return (
      <div className="relative aspect-video bg-black flex items-center justify-center">
        <Image
            src={item.thumbnailUrl}
            alt="poster image"
            fill
            className="opacity-0 pointer-events-none"
            onLoad={() => setIsPosterLoaded(true)}
        />
        {!isPosterLoaded && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
            <Preloader />
          </div>
        )}
        <div className={cn(
          "w-full h-full transition-opacity duration-500",
          isPosterLoaded ? 'opacity-100' : 'opacity-0'
        )}>
          <VideoPlayer
            source={videoSource}
            poster={item.thumbnailUrl}
            previewThumbnailsSrc={item.previewThumbnailsSrc}
          />
        </div>
      </div>
    );
  }

  if (item.type === 'image' && item.sourceUrl) {
    return (
      <div className="relative w-full h-auto flex-shrink-0 bg-black flex justify-center items-center group">
        <MemoizedImage
          src={item.sourceUrl}
          alt={item.title}
          width={1280}
          height={720}
          className="object-contain w-auto h-auto max-w-full max-h-full"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute inset-0 m-auto z-10 h-16 w-16 text-white bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onFullscreenClick(item.sourceUrl!)}
        >
          <FontAwesomeIcon icon={faExpand} className="h-8 w-8" />
          <span className="sr-only">Fullscreen</span>
        </Button>
      </div>
    );
  }

  return null;
};
PortfolioMedia.displayName = 'PortfolioMedia';

const PortfolioGridItem = ({ item, onClick }: { item: PortfolioItem, onClick: () => void }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="p-[2px] rounded-lg glass-effect">
      <div
        className={cn(
          'group relative cursor-pointer overflow-hidden rounded-md transition-all duration-300 hover:scale-[1.02] aspect-square',
          'bg-black/20'
        )}
        onClick={onClick}
      >
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Preloader />
          </div>
        )}
        <Image
          src={item.thumbnailUrl}
          alt={item.title}
          fill
          className={cn(
            "object-cover transition-opacity duration-500",
            isLoaded ? "opacity-100 group-hover:scale-105" : "opacity-0"
          )}
          data-ai-hint={item.thumbnailHint}
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          onLoad={() => setIsLoaded(true)}
        />
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4",
          !isLoaded && "opacity-100 bg-none" // Show overlay content while loading
        )}>
          {isLoaded ? (
            <>
              <h3 className="font-bold text-white text-lg">
                {item.title}
              </h3>
              <p className="text-white/80 text-sm line-clamp-2">
                {item.description}
              </p>
            </>
          ) : (
             <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"/>
          )}
        </div>
        {item.type === 'video' && isLoaded && (
          <div className="absolute top-4 right-4 w-[20%] h-[20%] flex items-center justify-center rounded-full glass-effect transition-colors">
            <FontAwesomeIcon icon={faFilm} className="h-1/2 w-1/2 text-white/80" />
          </div>
        )}
        {item.type === 'image' && isLoaded && (
            <div className="absolute top-4 right-4 w-[20%] h-[20%] flex items-center justify-center rounded-full glass-effect transition-colors">
                <FontAwesomeIcon icon={faPalette} className="h-1/2 w-1/2 text-white/80" />
            </div>
        )}
      </div>
    </div>
  );
};


export default function WorkPage() {
  const firestore = useFirestore();
  const projectsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'projects'), orderBy('order'))
        : null,
    [firestore]
  );
  const { data: portfolioItems, isLoading } = useCollection<PortfolioItem>(projectsQuery);


  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [visibleItems, setVisibleItems] = useState(12);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const isVeryUltrawide = useVeryUltrawide();
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredItems = useMemo(() => {
    if (!portfolioItems) return [];
    if (filter === 'all') return portfolioItems;
    return portfolioItems.filter(item => item.type === filter);
  }, [portfolioItems, filter]);


  const showMoreItems = () => {
    setVisibleItems(prevVisibleItems => prevVisibleItems + 8);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedItem(null);
    }
  };

  const handleDetailsOpenChange = (open: boolean) => {
    setDetailsModalOpen(open);
  };
  
  const isDescriptionLong = selectedItem?.description && selectedItem.description.length > 250;

  return (
    <>
      <div className="h-full w-full flex flex-col">
        <div className="p-[5%] pb-4">
          <div className="container mx-auto px-0">
            <div className="mb-8 text-center">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Our Work</h1>
              <p className="mt-2 max-w-2xl mx-auto text-base md:text-lg text-foreground/70">
                Browse our collection of projects. Click on any item to view
                details.
              </p>
            </div>
            <div className="flex justify-center gap-2 mb-4">
              <Button variant={filter === 'all' ? 'destructive' : 'outline'} onClick={() => setFilter('all')}>All</Button>
              <Button variant={filter === 'image' ? 'destructive' : 'outline'} onClick={() => setFilter('image')}>
                <FontAwesomeIcon icon={faPalette} className="mr-2 h-4 w-4" />
                Graphics
              </Button>
              <Button variant={filter === 'video' ? 'destructive' : 'outline'} onClick={() => setFilter('video')}>
                <FontAwesomeIcon icon={faFilm} className="mr-2 h-4 w-4" />
                Animation
              </Button>
            </div>
          </div>
        </div>
        <Separator className="bg-white/10" />

        <ScrollArea className="flex-1">
          <div className="p-[5%] pt-4">
            <div className="container mx-auto px-0">
               {isLoading && (
                <div className="flex justify-center items-center h-full min-h-[50vh]">
                    <Preloader />
                </div>
               )}
              {!isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
                  {filteredItems.slice(0, visibleItems).map(item => (
                    <PortfolioGridItem 
                      key={item.id}
                      item={item}
                      onClick={() => setSelectedItem(item)}
                    />
                  ))}
                </div>
              )}

              {filteredItems.length > 0 && visibleItems < filteredItems.length && (
                <div className="mt-12 text-center">
                  <Button onClick={showMoreItems} size="lg">
                    Show More
                  </Button>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      <Dialog open={!!selectedItem} onOpenChange={handleOpenChange}>
        <DialogContent 
            className={cn(
                "w-[95vw] md:w-[90vw] md:max-w-[80vw] glass-effect p-0 flex flex-col overflow-hidden",
                isVeryUltrawide || isDescriptionLong ? "h-[90vh]" : "h-auto"
            )}
        >
          {selectedItem && (
            <div className="relative flex-1 flex flex-col min-h-0">
              <ScrollArea className="flex-1">
                <div className="flex flex-col h-full">
                    {isClient && (
                      <PortfolioMedia
                          item={selectedItem}
                          onFullscreenClick={setFullscreenImageUrl}
                      />
                    )}
                    <div className="flex-shrink-0 p-4 md:p-6 pt-4">
                        <DialogHeader>
                            <DialogTitle className="text-xl md:text-2xl">
                            {selectedItem.title}
                            </DialogTitle>
                            <DialogDescription className="text-base text-foreground/70 mt-2 whitespace-pre-wrap">
                            {selectedItem.description}
                            </DialogDescription>
                        </DialogHeader>

                        {selectedItem.details && (
                            <div className="mt-4">
                            <Button
                                variant="default"
                                onClick={() => setDetailsModalOpen(true)}
                            >
                                <FontAwesomeIcon icon={faUpDown} className="mr-2" />
                                Show Details
                            </Button>
                            </div>
                        )}
                    </div>
                </div>
              </ScrollArea>
            </div>
          )}
           <DialogClose className="absolute top-4 right-4 z-[101] h-8 w-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
              <span className="sr-only">Close</span>
          </DialogClose>
        </DialogContent>
      </Dialog>
      
      {/* Nested Dialog for Details */}
      <Dialog open={detailsModalOpen} onOpenChange={handleDetailsOpenChange}>
        <DialogContent className="w-[95vw] md:w-[90vw] md:max-w-[80vw] h-[90vh] glass-effect p-0 flex flex-col">
            {selectedItem && (
                <>
                <DialogHeader className="p-4 md:p-6 pb-0">
                    <DialogTitle>{selectedItem.title} - Details</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1">
                    <div className="prose dark:prose-invert max-w-none space-y-4 text-sm text-foreground/80 whitespace-pre-wrap p-4 md:p-6">
                        <ReactMarkdown
                          rehypePlugins={[
                            rehypeRaw,
                            [rehypeSanitize, {
                                ...defaultSchema,
                                tagNames: [...(defaultSchema.tagNames || []), 'video'],
                                attributes: {
                                    ...defaultSchema.attributes,
                                    'video': [...(defaultSchema.attributes?.video || []), 'src', 'controls', 'poster']
                                }
                            }]
                          ]}
                          components={{
                            img: ({node, ...props}) => <img className="w-full rounded-lg" {...props} />,
                            video: ({node, ...props}) => {
                              const { src } = props;
                              if (!isClient || !src) return null;
                              
                              const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
                              const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)/;
                              
                              let videoSource = null;
                              const youtubeMatch = src.match(youtubeRegex);
                              if (youtubeMatch && youtubeMatch[1]) {
                                videoSource = {
                                  type: 'video',
                                  sources: [{ src: youtubeMatch[1], provider: 'youtube' }],
                                };
                              } else {
                                const vimeoMatch = src.match(vimeoRegex);
                                if (vimeoMatch && vimeoMatch[1]) {
                                  videoSource = {
                                    type: 'video',
                                    sources: [{ src: vimeoMatch[1], provider: 'vimeo' }],
                                  };
                                } else {
                                  videoSource = {
                                    type: 'video',
                                    sources: [{ src, type: 'video/mp4' }],
                                  };
                                }
                              }

                              return (
                                <div className="w-full rounded-lg overflow-hidden my-4">
                                  <VideoPlayer
                                    source={videoSource}
                                    poster={selectedItem.thumbnailUrl}
                                    previewThumbnailsSrc={selectedItem.previewThumbnailsSrc}
                                  />
                                </div>
                              );
                            }
                          }}
                        >{selectedItem.details || ''}</ReactMarkdown>
                    </div>
                </ScrollArea>
                 <DialogClose className="absolute top-4 right-4 z-[101] h-8 w-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </DialogClose>
                </>
            )}
        </DialogContent>
      </Dialog>

      {/* Fullscreen Image Dialog */}
      <Dialog open={!!fullscreenImageUrl} onOpenChange={(open) => !open && setFullscreenImageUrl(null)}>
        <DialogContent className="w-[95vw] h-[90vh] glass-effect p-0 flex flex-col items-center justify-center bg-black/80 border-0">
          <DialogTitle className="sr-only">Fullscreen Image</DialogTitle>
          {fullscreenImageUrl && (
            <div className="relative w-full h-full">
              <MemoizedImage
                src={fullscreenImageUrl}
                alt="Fullscreen Image"
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
          )}
          <DialogClose className="absolute top-4 right-4 z-[101] h-8 w-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
              <span className="sr-only">Close</span>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
}

    