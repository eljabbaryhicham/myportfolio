
'use client';

import Image from 'next/image';
import { portfolioItems, type PortfolioItem } from '@/lib/portfolio-data';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { useState, memo, useEffect, useRef } from 'react';
import { PlayCircle, ChevronsUpDown, X, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PlyrProps } from 'plyr-react';
import type Plyr from 'plyr';
import { useVeryUltrawide } from '@/hooks/use-very-ultrawide';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

const VideoPlayer = dynamic(() => import('@/components/video-player'), {
  ssr: false,
});

const ClientOnlyVideoPlayer = (
  props: PlyrProps & { innerRef: React.Ref<Plyr> }
) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient ? <VideoPlayer {...props} /> : null;
};
ClientOnlyVideoPlayer.displayName = 'ClientOnlyVideoPlayer';

const MemoizedImage = memo(Image);

const PortfolioMedia = ({
  item,
  playerRef,
}: {
  item: PortfolioItem;
  playerRef: React.Ref<Plyr>;
}) => {
  if (item.type === 'video' && item.sources) {
    return (
      <div className="w-full max-w-full max-h-full flex-shrink-0 bg-black">
        <ClientOnlyVideoPlayer
          innerRef={playerRef}
          source={{
            type: 'video',
            sources: item.sources.map(s => ({
              src: s.src,
              type: 'video/mp4',
              size: s.size,
            })),
            poster: item.thumbnailUrl,
          }}
        />
      </div>
    );
  }

  if (item.type === 'image' && item.sourceUrl) {
    return (
      <div className="relative w-full h-auto flex-shrink-0 bg-black flex justify-center items-center">
        <MemoizedImage
          src={item.sourceUrl}
          alt={item.title}
          width={1280}
          height={720}
          className="object-contain w-auto h-auto max-w-full max-h-full"
        />
      </div>
    );
  }

  return null;
};
PortfolioMedia.displayName = 'PortfolioMedia';

export default function WorkPage() {
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [visibleItems, setVisibleItems] = useState(6);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const playerRef = useRef<Plyr | null>(null);
  const detailsPlayerRef = useRef<Plyr | null>(null);
  const isVeryUltrawide = useVeryUltrawide();
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');


  useEffect(() => {
    return () => {
      if (playerRef.current) {
        // @ts-ignore
        playerRef.current.destroy?.();
      }
      if (detailsPlayerRef.current) {
        // @ts-ignore
        detailsPlayerRef.current.destroy?.();
      }
    };
  }, []);

  const filteredItems = portfolioItems.filter(item => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  const showMoreItems = () => {
    setVisibleItems(prevVisibleItems => prevVisibleItems + 6);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (playerRef.current) {
        try {
          // @ts-ignore
          playerRef.current.destroy?.();
        } catch (e) {
          console.error('Error destroying Plyr instance on close', e);
        }
        playerRef.current = null;
      }
      setSelectedItem(null);
    }
  };

  const handleDetailsOpenChange = (open: boolean) => {
    setDetailsModalOpen(open);
    if (!open) {
      if (detailsPlayerRef.current) {
        try {
          // @ts-ignore
          detailsPlayerRef.current.destroy?.();
        } catch (e) {
          console.error('Error destroying details Plyr instance on close', e);
        }
        detailsPlayerRef.current = null;
      }
    }
  };
  
  const isDescriptionLong = selectedItem?.description && selectedItem.description.length > 500;

  return (
    <>
      <div className="h-full w-full flex flex-col">
        <div className="p-8 pb-4">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold tracking-tight">Our Work</h1>
              <p className="mt-2 max-w-2xl mx-auto text-lg text-foreground/70">
                Browse our collection of projects. Click on any item to view
                details.
              </p>
            </div>
            <div className="flex justify-center gap-2 mb-4">
              <Button variant={filter === 'all' ? 'destructive' : 'outline'} onClick={() => setFilter('all')}>All</Button>
              <Button variant={filter === 'image' ? 'destructive' : 'outline'} onClick={() => setFilter('image')}>Images</Button>
              <Button variant={filter === 'video' ? 'destructive' : 'outline'} onClick={() => setFilter('video')}>Videos</Button>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-8 pt-0">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.slice(0, visibleItems).map(item => (
                  <div
                    key={item.id}
                    className={cn(
                      'group relative cursor-pointer overflow-hidden rounded-md transition-all duration-300 hover:scale-[1.02] aspect-square glass-effect'
                    )}
                    onClick={() => setSelectedItem(item)}
                  >
                    <Image
                      src={item.thumbnailUrl}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      data-ai-hint={item.thumbnailHint}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <h3 className="font-bold text-white text-lg">
                        {item.title}
                      </h3>
                      <p className="text-white/80 text-sm line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                    {item.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                        <PlayCircle className="h-16 w-16 text-white/80" />
                      </div>
                    )}
                    {item.type === 'image' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                            <ImageIcon className="h-16 w-16 text-white/80" />
                        </div>
                    )}
                  </div>
                ))}
              </div>

              {visibleItems < filteredItems.length && (
                <div className="mt-12">
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
                "w-[90vw] md:max-w-[80vw] glass-effect p-0 flex flex-col overflow-hidden",
                isVeryUltrawide || isDescriptionLong ? "h-[90vh]" : "h-auto"
            )}
        >
          {selectedItem && (
            <div className="relative flex-1 flex flex-col min-h-0">
              <ScrollArea className="flex-1">
                <div className="flex flex-col h-full">
                    <div className="flex-shrink-0">
                        <PortfolioMedia item={selectedItem} playerRef={playerRef} />
                    </div>
                    <div className="flex-shrink-0 p-6 pt-4">
                        <DialogHeader>
                            <DialogTitle className="text-2xl">
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
                                <ChevronsUpDown className="mr-2" />
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
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
          </DialogClose>
        </DialogContent>
      </Dialog>
      
      {/* Nested Dialog for Details */}
      <Dialog open={detailsModalOpen} onOpenChange={handleDetailsOpenChange}>
        <DialogContent className="w-[90vw] md:max-w-[80vw] h-[90vh] glass-effect p-0 flex flex-col">
            {selectedItem && (
                <>
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>{selectedItem.title} - Details</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1">
                    <div className="prose dark:prose-invert max-w-none space-y-4 text-sm text-foreground/80 whitespace-pre-wrap p-6">
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
                            img: ({node, ...props}) => <img className="w-full rounded-md" {...props} />,
                            video: ({node, ...props}) => {
                              const { src } = props;
                              if (!src) return null;
                              return (
                                <div className="w-full rounded-md overflow-hidden my-4">
                                  <ClientOnlyVideoPlayer
                                    innerRef={detailsPlayerRef}
                                    source={{
                                      type: 'video',
                                      sources: [{ src, type: 'video/mp4' }],
                                      poster: selectedItem.thumbnailUrl,
                                    }}
                                  />
                                </div>
                              );
                            }
                          }}
                        >{selectedItem.details || ''}</ReactMarkdown>
                    </div>
                </ScrollArea>
                 <DialogClose className="absolute top-4 right-4 z-[101] h-8 w-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </DialogClose>
                </>
            )}
        </DialogContent>
      </Dialog>

    </>
  );
}

    
