'use client';

import { useState, useEffect } from 'react';
import CdnClapprPlayer from '@/components/CdnClapprPlayer';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import Preloader from '@/components/preloader';

export default function TestPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  
  const defaultUrl = 'https://live-hls-abr-cdn.livepush.io/live/bigbuckbunnyclip/index.m3u8';
  const [source, setSource] = useState(defaultUrl);
  const [inputValue, setInputValue] = useState(defaultUrl);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);


  const handleLoadClick = () => {
    setSource(inputValue);
  };
  
  if (isUserLoading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Preloader />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-4 md:p-8">
      <div className="text-center mb-8 w-full max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-headline tracking-tight">Streaming Test</h1>
        <p className="mt-2 text-base md:text-lg text-foreground/70">
          Enter a video URL (DASH or HLS) below to test playback.
        </p>
        <div className="mt-4 flex w-full items-center space-x-2">
          <Input
            type="url"
            placeholder="Enter video URL..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="text-base"
          />
          <Button type="submit" onClick={handleLoadClick}>
            <FontAwesomeIcon icon={faPlay} className="mr-2 h-4 w-4" />
            Load
          </Button>
        </div>
      </div>
      <Separator className="bg-white/10 w-full max-w-4xl mb-8" />
      <div className="w-full max-w-4xl aspect-video rounded-lg overflow-hidden glass-effect">
        <CdnClapprPlayer key={source} source={source} autoPlay={true} />
      </div>
    </div>
  );
}
