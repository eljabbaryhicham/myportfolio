
'use client';

import { useState, useEffect, useMemo } from 'react';
import CdnClapprPlayer from '@/components/CdnClapprPlayer';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import { useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { useRouter, notFound } from 'next/navigation';
import Preloader from '@/components/preloader';
import { doc } from 'firebase/firestore';
import PlyrPlayer from '@/components/PlyrPlayer';
import type { AppUser } from '@/firebase/auth/use-user';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { isSuperAdmin as isSuperAdminCheck } from '@/lib/constants';
import type { HomePageSettings } from '@/lib/types';
import { useHomePageSettings } from '@/components/settings/home-page-settings-provider';

export default function TestPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const defaultUrl = 'https://res.cloudinary.com/da1srnoer/video/upload/sp_auto/v1761114792/u7h3zjwcglk5vzlxwiaq.m3u8';
  const [source, setSource] = useState(defaultUrl);
  const [inputValue, setInputValue] = useState(defaultUrl);

  const typedUser = user as AppUser | null;
  const isSuperAdmin = isSuperAdminCheck(typedUser);

  // homepage/settings is sourced from the shared provider (server-seeded + live).
  // TestPage still needs the writeable settingsDocRef to toggle workPagePlayer.
  const { settings: homeSettings } = useHomePageSettings();
  const settingsDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
    [firestore]
  );
  const workPagePlayer = homeSettings?.workPagePlayer || 'clappr';


  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (homeSettings && homeSettings.isTestPageEnabled === false) {
      notFound();
    }
  }, [homeSettings]);


  const handleLoadClick = () => {
    setSource(inputValue);
  };
  
  const handleSwitchPlayer = () => {
    if (!settingsDocRef || !isSuperAdmin) return;
    const cycle: Record<string, string> = { plyr: 'clappr', clappr: 'plyr' };
    const newPlayer = cycle[homeSettings?.workPagePlayer || 'clappr'] || 'plyr';
    setDocumentNonBlocking(settingsDocRef, { workPagePlayer: newPlayer }, { merge: true });
    const names: Record<string, string> = { plyr: 'Plyr', clappr: 'Clappr' };
    toast({
      title: t('test.toast.playerSwitched.title'),
      description: t('test.toast.playerSwitched.description').replace('{player}', names[newPlayer] || newPlayer),
    });
  };

  if (isUserLoading || !user || (homeSettings && homeSettings.isTestPageEnabled === false)) {
    return null;
  }

  return (
    <div className="h-full w-full flex items-center justify-center p-4 md:p-8">
      <div className='w-full flex flex-col items-center justify-center'>
        <div className="text-center mb-8 w-full max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-headline tracking-tight">{t('test.heading')}</h1>
          <p className="mt-2 text-base md:text-lg text-foreground/70">
            {t('test.description').replace('{player}', ({ plyr: 'Plyr', clappr: 'Clappr' })[workPagePlayer] || workPagePlayer)}
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
        
        {isSuperAdmin && (
          <div className="mb-4">
             <Button
                variant="default"
                size="sm"
                onClick={handleSwitchPlayer}
                title={t('test.switchPlayer')}
              >
                <FontAwesomeIcon icon={faSyncAlt} className="mr-2 h-4 w-4" />
                {t('test.switchPlayer')}
              </Button>
          </div>
        )}

        <Separator className="bg-white/10 w-full max-w-4xl mb-8" />

        <div className="w-full max-w-4xl aspect-video bg-black">
          {workPagePlayer === 'clappr' ? (
              <CdnClapprPlayer key={source} source={source} autoPlay={true} />
          ) : (
              <PlyrPlayer key={source} source={source} autoPlay={true} />
          )}
        </div>
      </div>
    </div>
  );
}
