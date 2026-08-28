'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUploadProgress } from '@/components/upload-progress-context';

export function AdminTabInitializer() {
  const searchParams = useSearchParams();
  const { setActiveMediaTab } = useUploadProgress();

  useEffect(() => {
    const tab = searchParams.get('tab');
    const innerTab = searchParams.get('innerTab');
    const mediaTab = searchParams.get('mediaTab');
    
    if (tab === 'media' && innerTab && (innerTab === 'cloudinary' || innerTab === 'vercel')) {
      // The inner tab will be set by the admin page's setInnerMediaTab
      // This component just ensures the media tab is active in the upload progress context
      if (mediaTab) {
        setActiveMediaTab(mediaTab);
      }
    }
  }, [searchParams, setActiveMediaTab]);

  return null;
}