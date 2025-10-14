import { portfolioItems } from "@/lib/portfolio-data";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

export default function Home() {
  const featuredItem = portfolioItems.find((item) => item.featured);

  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-12">
          <div className="text-center md:text-left">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter bg-gradient-to-br from-primary via-primary to-foreground/80 bg-clip-text text-transparent pb-4">
              Liquid Folio
            </h1>
            <p className="mt-4 max-w-xl text-lg text-foreground/70 mx-auto md:mx-0">
              A design and media portfolio where creativity flows. Explore featured works in video and photography.
            </p>
            <Button asChild size="lg" className="mt-8 group">
              <Link href="/work">
                Explore Work
                <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
          <div className="relative flex justify-center">
            {featuredItem && (
              <Link href="/work" className="block w-full max-w-md">
                <div className="group relative aspect-[4/3] w-full overflow-hidden border-2 bg-card/60 backdrop-blur-xl p-2 transition-all duration-300 hover:scale-105">
                    <Image
                      src={featuredItem.thumbnailUrl}
                      alt={featuredItem.title}
                      fill
                      className="object-cover"
                      data-ai-hint={featuredItem.thumbnailHint}
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-4 flex flex-col justify-end">
                      <h3 className="text-xl font-bold text-white">{featuredItem.title}</h3>
                      <p className="text-sm text-white/80">{featuredItem.description}</p>
                    </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
