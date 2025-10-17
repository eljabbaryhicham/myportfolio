
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <Button asChild size="lg" className="group">
        <Link href="/work">
          Explore Work
          <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1" />
        </Link>
      </Button>
    </div>
  );
}
