'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useUploadProgress } from '@/components/upload-progress-context';
import { Progress } from '@/components/ui/progress';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faArrowUpRightFromSquare, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';

export default function UploadProgressNotification() {
  const { vercel, cloudinary, activeMediaTab, clearFileName, completedUpload } = useUploadProgress();
  const pathname = usePathname();
  const router = useRouter();

  // Track recently completed uploads (show for 3s after finish)
  const [recentlyCompleted, setRecentlyCompleted] = useState<Array<{ provider: 'vercel' | 'cloudinary'; fileName: string; completedAt: number }>>([]);
  const prevVercelUploading = useRef(vercel.isUploading);
  const prevCloudinaryUploading = useRef(cloudinary.isUploading);

  // Detect upload completion (was uploading, now not) — fileName stays set by finishUpload for this detection
  useEffect(() => {
    if (prevVercelUploading.current && !vercel.isUploading && vercel.fileName) {
      setRecentlyCompleted(prev => [...prev, { provider: 'vercel', fileName: vercel.fileName, completedAt: Date.now() }]);
      clearFileName('vercel');
    }
    prevVercelUploading.current = vercel.isUploading;
  }, [vercel.isUploading, vercel.fileName, clearFileName]);

  useEffect(() => {
    if (prevCloudinaryUploading.current && !cloudinary.isUploading && cloudinary.fileName) {
      setRecentlyCompleted(prev => [...prev, { provider: 'cloudinary', fileName: cloudinary.fileName, completedAt: Date.now() }]);
      clearFileName('cloudinary');
    }
    prevCloudinaryUploading.current = cloudinary.isUploading;
  }, [cloudinary.isUploading, cloudinary.fileName, clearFileName]);

  // Clean up expired completed entries (older than 3s)
  useEffect(() => {
    const timer = setInterval(() => {
      setRecentlyCompleted(prev => prev.filter(c => Date.now() - c.completedAt < 3000));
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const goToMediaTab = (provider: 'vercel' | 'cloudinary') => {
    localStorage.setItem('adminActiveTab', 'media');
    localStorage.setItem('adminInnerMediaTab', provider);
    const tab = completedUpload?.resourceType === 'video' ? 'videos' : completedUpload?.resourceType === 'raw' ? 'files' : 'images';
    // If already on admin page, dispatch event to open library directly
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

  // Active uploads — hide at 100% since the completed card replaces them
  const activeUploads = [
    vercel.isUploading && vercel.progress < 100 ? { ...vercel, provider: 'vercel' as const } : null,
    cloudinary.isUploading && cloudinary.progress < 100 ? { ...cloudinary, provider: 'cloudinary' as const } : null,
  ].filter(Boolean) as Array<{ isUploading: boolean; progress: number; fileName: string; provider: 'vercel' | 'cloudinary' }>;

  // Filter active uploads: hide when user is on the matching admin tab
  const visibleActiveUploads = activeUploads.filter((u) => {
    if (pathname !== '/admin') return true;
    if (u.provider === 'vercel' && activeMediaTab === 'vercel') return false;
    if (u.provider === 'cloudinary' && activeMediaTab === 'cloudinary') return false;
    return true;
  });

  // Show completed uploads always (don't filter by tab — user needs the maximize button)
  const visibleCompleted = recentlyCompleted;

  if (visibleActiveUploads.length === 0 && visibleCompleted.length === 0) return null;

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
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 shrink-0"
              onClick={() => goToMediaTab(u.provider)}
              title="Open in media library"
            >
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-3">
            <Progress value={u.progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1 text-right">{Math.round(u.progress)}%</p>
          </div>
        </div>
      ))}
      {visibleCompleted.map((c) => (
        <div key={`done-${c.provider}-${c.completedAt}`} className="glass-effect border rounded-lg p-4 shadow-2xl animate-in slide-in-from-bottom-2 border-green-500/30">
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
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 shrink-0"
              onClick={() => goToMediaTab(c.provider)}
              title="Open in media library"
            >
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
