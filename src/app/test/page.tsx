
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import CdnClapprPlayer from '@/components/CdnClapprPlayer';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import { useUser } from '@/firebase';
import { useRouter, notFound } from 'next/navigation';
import Preloader from '@/components/preloader';
import PlyrPlayer from '@/components/PlyrPlayer';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { HomePageSettings } from '@/lib/types';
import { useHomePageSettings } from '@/components/settings/home-page-settings-provider';

type PlayerChoice = 'plyr' | 'clappr';

export default function TestPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { t } = useTranslation();

  const defaultUrl = 'https://res.cloudinary.com/da1srnoer/video/upload/sp_auto/v1761114792/u7h3zjwcglk5vzlxwiaq.m3u8';
  const [source, setSource] = useState(defaultUrl);
  const [inputValue, setInputValue] = useState(defaultUrl);
  const [localPlayer, setLocalPlayer] = useState<PlayerChoice>('clappr');
  const userChangedRef = useRef(false);

  const { settings: homeSettings, hasLiveData } = useHomePageSettings();
  const workPagePlayer = (homeSettings?.workPagePlayer as PlayerChoice) || 'clappr';

  useEffect(() => {
    if (!userChangedRef.current && homeSettings?.workPagePlayer) {
      setLocalPlayer(homeSettings.workPagePlayer as PlayerChoice);
    }
  }, [homeSettings?.workPagePlayer]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleLoadClick = () => {
    setSource(inputValue);
  };

  const handlePlayerChoice = (choice: PlayerChoice) => {
    userChangedRef.current = true;
    setLocalPlayer(choice);
  };

  if (isUserLoading) {
    return null;
  }

  if (!user) {
    return null;
  }

  // Wait for the live settings snapshot before deciding, so a stale SSR seed
  // can never wrongly show the 404 page.
  if (!hasLiveData) {
    return (
      <div className="flex items-center justify-center h-full">
        <Preloader />
      </div>
    );
  }

  if (homeSettings?.isTestPageEnabled === false) {
    notFound();
  }

  return (
    <div className="h-full w-full flex items-center justify-center p-4 md:p-8">
      <div className='w-full flex flex-col items-center justify-center'>
        <div className="text-center mb-8 w-full max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-headline tracking-tight">{t('test.heading')}</h1>
          <p className="mt-2 text-base md:text-lg text-foreground/70">
            {t('test.description').replace('{player}', ({ plyr: 'Plyr', clappr: 'Clappr' })[localPlayer] || localPlayer)}
          </p>
          <div className="mt-4 flex w-full items-center space-x-2">
            <Input
              type="url"
              placeholder={t('test.placeholder')}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="text-base"
            />
            <Button type="submit" onClick={handleLoadClick}>
              <FontAwesomeIcon icon={faPlay} className="mr-2 h-4 w-4" />
              {t('test.load')}
            </Button>
          </div>
        </div>

        <div className="mb-4 inline-flex rounded-md border border-white/10 overflow-hidden">
          <Button
            variant={localPlayer === 'plyr' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePlayerChoice('plyr')}
            className="rounded-none"
          >
            Plyr
          </Button>
          <Button
            variant={localPlayer === 'clappr' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePlayerChoice('clappr')}
            className="rounded-none"
          >
            Clappr
          </Button>
        </div>

        <Separator className="bg-white/10 w-full max-w-4xl mb-8" />

        <div className="w-full max-w-4xl aspect-video bg-black">
          {localPlayer === 'clappr' ? (
              <CdnClapprPlayer key={source} source={source} autoPlay={true} />
          ) : (
              <PlyrPlayer key={source} source={source} autoPlay={true} />
          )}
        </div>
      </div>
    </div>
  );
}
