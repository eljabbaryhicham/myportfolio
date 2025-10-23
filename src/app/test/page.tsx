
'use client';

import CdnClapprPlayer from '@/components/CdnClapprPlayer';
import { Separator } from '@/components/ui/separator';

export default function TestPage() {
  const hlsStreamUrl = 'https://live-hls-abr-cdn.livepush.io/live/bigbuckbunnyclip/index.m3u8';

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-4 md:p-8">
        <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-headline tracking-tight">Streaming Test</h1>
            <p className="mt-2 max-w-2xl mx-auto text-base md:text-lg text-foreground/70">
                This page is for testing HLS video stream playback.
            </p>
        </div>
        <Separator className="bg-white/10 w-full max-w-4xl mb-8" />
        <div className="w-full max-w-4xl aspect-video rounded-lg overflow-hidden glass-effect">
            <CdnClapprPlayer source={hlsStreamUrl} />
        </div>
    </div>
  );
}
