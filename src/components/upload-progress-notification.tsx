'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useUploadProgress } from '@/components/upload-progress-context';
import { Progress } from '@/components/ui/progress';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faArrowUpRightFromSquare, faCheckCircle, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';

export default function UploadProgressNotification() {
  const { vercel, cloudinary, activeMediaTab, clearFileName, completedUpload } = useUploadProgress();
  const pathname = usePathname();
  const router = useRouter();

  const [completed, setCompleted] = useState<Array<{ provider: 'vercel' | 'cloudinary'; fileName: string; id: number }>>([]);
  const [dismissedActive, setDismissedActive] = useState<Array<'vercel' | 'cloudinary'>>([]);
  const prevVercelUploading = useRef(vercel.isUploading);
  const prevCloudinaryUploading = useRef(cloudinary.isUploading);
  const nextId = useRef(0);

  // Re-show an active upload's card whenever a fresh upload starts for that
  // provider (dismiss only affects the current run, not future uploads).
  useEffect(() => {
    if (vercel.isUploading && vercel.fileName) {
      setDismissedActive(prev => prev.filter(p => p !== 'vercel'));
    }
  }, [vercel.isUploading, vercel.fileName]);

  useEffect(() => {
    if (cloudinary.isUploading && cloudinary.fileName) {
      setDismissedActive(prev => prev.filter(p => p !== 'cloudinary'));
    }
  }, [cloudinary.isUploading, cloudinary.fileName]);

  useEffect(() => {
    if (prevVercelUploading.current && !vercel.isUploading && vercel.fileName) {
      setCompleted(prev => [...prev, { provider: 'vercel', fileName: vercel.fileName, id: nextId.current++ }]);
      clearFileName('vercel');
    }
    prevVercelUploading.current = vercel.isUploading;
  }, [vercel.isUploading, vercel.fileName, clearFileName]);

  useEffect(() => {
    if (prevCloudinaryUploading.current && !cloudinary.isUploading && cloudinary.fileName) {
      setCompleted(prev => [...prev, { provider: 'cloudinary', fileName: cloudinary.fileName, id: nextId.current++ }]);
      clearFileName('cloudinary');
    }
    prevCloudinaryUploading.current = cloudinary.isUploading;
  }, [cloudinary.isUploading, cloudinary.fileName, clearFileName]);

  const dismiss = (id: number) => {
    setCompleted(prev => prev.filter(c => c.id !== id));
  };

  const goToMediaTab = (provider: 'vercel' | 'cloudinary') => {
    localStorage.setItem('adminActiveTab', 'media');
    localStorage.setItem('adminInnerMediaTab', provider);
    const tab = completedUpload?.resourceType === 'video' ? 'videos' : completedUpload?.resourceType === 'raw' ? 'files' : 'images';
    if (pathname === '/admin') {
      window.dispatchEvent(new CustomEvent('media-library-maximize', {
        detail: {
          provider,
          tab,
          library: completedUpload?.libraryId || 'primary',
          docId: completedUpload?.docId || null,
        }
      }));
    } else {
      router.push('/admin');
    }
  };

  const activeUploads = [
    vercel.isUploading && vercel.progress < 100 ? { ...vercel, provider: 'vercel' as const } : null,
    cloudinary.isUploading && cloudinary.progress < 100 ? { ...cloudinary, provider: 'cloudinary' as const } : null,
  ].filter(Boolean) as Array<{ isUploading: boolean; progress: number; fileName: string; provider: 'vercel' | 'cloudinary' }>;

  const visibleActiveUploads = activeUploads.filter((u) => {
    if (dismissedActive.includes(u.provider)) return false;
    if (pathname !== '/admin') return true;
    if (u.provider === 'vercel' && activeMediaTab === 'vercel') return false;
    if (u.provider === 'cloudinary' && activeMediaTab === 'cloudinary') return false;
    return true;
  });

  if (visibleActiveUploads.length === 0 && completed.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-80">
      {visibleActiveUploads.map((u) => (
        <div key={`active-${u.provider}`} className="glass-effect border rounded-lg p-4 shadow-2xl animate-in slide-in-from-bottom-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={faCloudUploadAlt} className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">Uploading to {u.provider === 'vercel' ? 'Vercel Blob' : 'Cloudinary'}</p>
                <p className="text-xs text-muted-foreground truncate">{u.fileName}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 shrink-0"
                onClick={() => goToMediaTab(u.provider)}
                title="Open in media library"
              >
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 shrink-0"
                onClick={() => setDismissedActive(prev => [...prev, u.provider])}
                title="Dismiss"
                aria-label="Dismiss"
              >
                <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="mt-3">
            <Progress value={u.progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1 text-right">{Math.round(u.progress)}%</p>
          </div>
        </div>
      ))}
      {completed.map((c) => (
        <div key={`done-${c.id}`} className="glass-effect border rounded-lg p-4 shadow-2xl animate-in slide-in-from-bottom-2 border-green-500/30">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={faCheckCircle} className="h-5 w-5 text-green-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">Uploaded to {c.provider === 'vercel' ? 'Vercel Blob' : 'Cloudinary'}</p>
                <p className="text-xs text-muted-foreground truncate">{c.fileName}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => { dismiss(c.id); goToMediaTab(c.provider); }}
                title="Open in media library"
              >
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => dismiss(c.id)}
                title="Dismiss"
              >
                <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
