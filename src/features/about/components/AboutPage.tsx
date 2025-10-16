
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="h-full w-full flex items-center justify-center p-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="w-full glass-effect">
          <CardHeader className="text-center">
            <h1 className="text-4xl font-bold tracking-tight">About Us</h1>
            <p className="mt-2 text-lg text-foreground/70">
              The story behind the creativity.
            </p>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none text-left">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-1/2">
                <Image
                  src="https://picsum.photos/seed/aboutus/800/600"
                  alt="Our Team"
                  width={800}
                  height={600}
                  className="rounded-lg"
                  data-ai-hint="team working"
                />
              </div>
              <div className="md:w-1/2">
                <h2 className="text-2xl font-bold">Our Mission</h2>
                <p>
                  Welcome to Liquid Folio, where creativity flows and ideas take shape. We are a passionate team of designers, artists, and storytellers dedicated to pushing the boundaries of visual expression. Our work is a blend of artistry and technology, creating experiences that are both beautiful and meaningful.
                </p>
                <p>
                  Founded on the principle of fluidity, we believe that the best ideas are those that can adapt, evolve, and move people. From stunning visuals to compelling narratives, we strive to create work that not only captures attention but also leaves a lasting impression.
                </p>
                <h3 className="text-xl font-bold mt-4">Our Journey</h3>
                <p>
                  Our journey began with a simple sketch and a bold vision. Over the years, we have grown into a collective of creative minds, each bringing a unique perspective to the table. We thrive on collaboration and are constantly exploring new techniques and technologies to bring our clients' visions to life.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
