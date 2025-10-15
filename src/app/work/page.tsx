
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
import { useState }from "react";
import { PlayCircle, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const VideoPlayer = dynamic(() => import("@/components/video-player"), {
  ssr: false,
});


export default function WorkPage() {
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [visibleItems, setVisibleItems] = useState(6);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const showMoreItems = () => {
    setVisibleItems((prevVisibleItems) => prevVisibleItems + 6);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedItem(null);
      setIsDetailsOpen(false); // Reset details when closing dialog
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
                      "group relative cursor-pointer overflow-hidden bg-card/50 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] aspect-square"
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
        <DialogContent className="glass-effect max-w-4xl w-full p-0 overflow-hidden">
          {selectedItem && (
            <div>
              {selectedItem.type === "video" ? (
                <VideoPlayer
                  source={{
                    type: "video",
                    sources: [{ src: selectedItem.sourceUrl }],
                  }}
                />
              ) : (
                <div className="relative aspect-video bg-black/50">
                  <Image src={selectedItem.sourceUrl} alt={selectedItem.title} fill className="object-contain" />
                </div>
              )}
              <div className="p-6">
                <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                  <DialogHeader>
                    <DialogTitle className="text-2xl">{selectedItem.title}</DialogTitle>
                    <DialogDescription className="text-base text-foreground/70 mt-2">
                      {selectedItem.description}
                    </DialogDescription>
                  </DialogHeader>

                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="mt-4 -ml-4">
                      <ChevronsUpDown className="mr-2 h-4 w-4" />
                      Expand details
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="mt-4 space-y-2 border-t pt-4">
                      <p><strong className="font-semibold">ID:</strong> {selectedItem.id}</p>
                      <p><strong className="font-semibold">Type:</strong> {selectedItem.type}</p>
                      <p><strong className="font-semibold">Featured:</strong> {selectedItem.featured ? 'Yes' : 'No'}</p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
