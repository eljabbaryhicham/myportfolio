
'use client';

import { useState, useEffect, useRef } from 'react';
import CdnClapprPlayer from '@/components/CdnClapprPlayer';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import Preloader from '@/components/preloader';
import PlyrPlayer from '@/components/PlyrPlayer';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { isSuperAdmin as isSuperAdminCheck } from '@/lib/constants';
import type { HomePageSettings } from '@/lib/types';

type PlayerChoice = 'plyr' | 'clappr';

export default function TestPage() {
  const { user, isUserLoading } = useUser();
  const { t } = useTranslation();

  const defaultUrl = 'https://res.cloudinary.com/dsq1lxrqi/video/upload/v1787606668/Showreel_2026_MOD_o9zim0.mp4';
  const [source, setSource] = useState(defaultUrl);
  const [inputValue, setInputValue] = useState(defaultUrl);
  const [localPlayer, setLocalPlayer] = useState<PlayerChoice>('clappr');
  const userChangedRef = useRef(false);

  // The global HomePageSettingsProvider is now seed-first (no live doc), so
  // this QA page keeps its own live `useDoc` subscription to homepage/settings
  // to act on the true current Firestore state.
  const firestore = useFirestore();
  const settingsDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
    [firestore]
  );
  const { data: liveSettings } = useDoc<HomePageSettings>(settingsDocRef);

  useEffect(() => {
    if (!userChangedRef.current && liveSettings?.workPagePlayer) {
      setLocalPlayer(liveSettings.workPagePlayer as PlayerChoice);
    }
  }, [liveSettings?.workPagePlayer]);

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

  const isSuperAdmin = isSuperAdminCheck(user);

  // Wait for the live settings snapshot before deciding, so a stale SSR seed
  // can never wrongly show the 404 page. When the test page is enabled, anyone
  // (signed in or not) can open it. When disabled, only the super admin may —
  // everyone else gets a 404.
  if (!liveSettings) {
    return (
      <div className="flex items-center justify-center h-full">
        <Preloader />
      </div>
    );
  }

  if (liveSettings?.isTestPageEnabled === false && !isSuperAdmin) {
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
            variant={localPlayer === 'plyr' ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => handlePlayerChoice('plyr')}
            className="rounded-none"
          >
            Plyr
          </Button>
          <Button
            variant={localPlayer === 'clappr' ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => handlePlayerChoice('clappr')}
            className="rounded-none"
          >
            Clappr
          </Button>
        </div>

        <Separator className="bg-white/10 w-full max-w-4xl mb-8" />

        <div className="relative w-full max-w-4xl aspect-video bg-black">
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
