
"use client";

import Image from "next/image";
import { portfolioItems, type PortfolioItem } from "@/lib/portfolio-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState, memo, useEffect } from "react";
import { PlayCircle, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PlyrProps } from "plyr-react";

const VideoPlayer = dynamic(() => import("@/components/video-player"), {
  ssr: false,
});

const ClientOnlyVideoPlayer = (props: PlyrProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient ? <VideoPlayer {...props} /> : null;
};
ClientOnlyVideoPlayer.displayName = 'ClientOnlyVideoPlayer'


const MemoizedImage = memo(Image);

const PortfolioMedia = ({ item }: { item: PortfolioItem }) => {
  if (item.type === "video" && item.sources) {
    return (
      <div className="w-full h-auto flex-shrink-0 bg-black">
        <ClientOnlyVideoPlayer
          source={{
            type: "video",
            sources: item.sources.map(s => ({ src: s.src, type: 'video/mp4', size: s.size })),
          }}
        />
      </div>
    );
  }

  if (item.type === 'image' && item.sourceUrl) {
    return (
      <div className="relative w-full h-auto flex-shrink-0 bg-black flex justify-center items-center">
         <MemoizedImage src={item.sourceUrl} alt={item.title} width={1280} height={720} className="object-contain w-auto h-auto max-w-full max-h-full" />
      </div>
    );
  }
  
  return null;
};
PortfolioMedia.displayName = 'PortfolioMedia';


const PortfolioDetails = ({ item }: { item: PortfolioItem }) => {
  return (
    <>
      <DialogHeader className="p-6 pb-0">
        <DialogTitle className="text-2xl">{item.title}</DialogTitle>
        <DialogDescription className="text-base text-foreground/70 mt-2">
          {item.description}
        </DialogDescription>
      </DialogHeader>
      {item.details && (
        <ScrollArea className="flex-1 px-6">
            <div className="mt-4 space-y-4 border-t pt-4 text-sm text-foreground/80 whitespace-pre-wrap">
                <p>{item.details}</p>
            </div>
        </ScrollArea>
      )}
    </>
  )
}
PortfolioDetails.displayName = 'PortfolioDetails';


export default function WorkPage() {
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [visibleItems, setVisibleItems] = useState(6);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const showMoreItems = () => {
    setVisibleItems((prevVisibleItems) => prevVisibleItems + 6);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedItem(null);
      setDetailsVisible(false);
    }
  };


  return (
    <>
      <div className="h-full w-full flex flex-col">
        <div className="p-8 pb-0">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold tracking-tight">Our Work</h1>
                <p className="mt-2 max-w-2xl mx-auto text-lg text-foreground/70">
                  Browse our collection of projects. Click on any item to view details.
                </p>
              </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {portfolioItems.slice(0, visibleItems).map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "group relative cursor-pointer overflow-hidden rounded-md bg-card/50 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] aspect-square"
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
                      <h3 className="font-bold text-white text-lg">{item.title}</h3>
                      <p className="text-white/80 text-sm line-clamp-2">{item.description}</p>
                    </div>
                    {item.type === "video" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                        <PlayCircle className="h-16 w-16 text-white/80" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {visibleItems < portfolioItems.length && (
                <div className="text-center mt-12">
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
        <DialogContent className="glass-effect p-0 flex flex-col max-w-[90vw] max-h-[90vh]">
          {selectedItem && (
            <div className="relative flex-1 flex flex-col min-h-0">
              <ScrollArea className="flex-1">
                <div className="flex flex-col">
                  <div className="flex-shrink-0 bg-black/50 flex items-center justify-center">
                    <PortfolioMedia item={selectedItem} />
                  </div>
                  <div className="flex flex-col p-6 bg-background/80">
                    <DialogHeader className="text-left">
                      <DialogTitle className="text-2xl">{selectedItem.title}</DialogTitle>
                      <DialogDescription className="text-base text-foreground/70 mt-2">
                        {selectedItem.description}
                      </DialogDescription>
                    </DialogHeader>
                    {selectedItem.details && (
                      <Button
                        variant="secondary"
                        className="mt-4 self-start"
                        onClick={() => setDetailsVisible(true)}
                      >
                        <ChevronsUpDown className="mr-2" />
                        Show Details
                      </Button>
                    )}
                  </div>
                </div>
              </ScrollArea>

              <div
                className={cn(
                  "absolute inset-0 bg-background/80 backdrop-blur-sm transition-transform duration-500 ease-in-out flex flex-col",
                  detailsVisible ? "translate-y-0" : "translate-y-full"
                )}
              >
                <PortfolioDetails item={selectedItem} />
              </div>

              {detailsVisible && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-12 z-30"
                  onClick={() => setDetailsVisible(false)}
                >
                  <X />
                  <span className="sr-only">Close Details</span>
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
