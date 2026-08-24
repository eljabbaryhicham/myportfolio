'use client';

import { usePathname } from 'next/navigation';
import { useUploadProgress } from '@/components/upload-progress-context';
import { Progress } from '@/components/ui/progress';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function UploadProgressNotification() {
  const { vercel, cloudinary, activeMediaTab } = useUploadProgress();
  const pathname = usePathname();

  const activeUploads = [
    vercel.isUploading ? { ...vercel, provider: 'vercel' as const } : null,
    cloudinary.isUploading ? { ...cloudinary, provider: 'cloudinary' as const } : null,
  ].filter(Boolean) as Array<{ isUploading: boolean; progress: number; fileName: string; provider: 'vercel' | 'cloudinary' }>;

  if (activeUploads.length === 0) return null;

  // Hide notification for a provider when the user is on its upload section (inline progress visible there)
  const visibleUploads = activeUploads.filter((u) => {
    if (pathname !== '/admin') return true;
    if (u.provider === 'vercel' && activeMediaTab === 'vercel') return false;
    if (u.provider === 'cloudinary' && activeMediaTab === 'cloudinary') return false;
    return true;
  });

  if (visibleUploads.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-80">
      {visibleUploads.map((u) => (
        <div key={u.provider} className="glass-effect border rounded-lg p-4 shadow-2xl animate-in slide-in-from-bottom-2">
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
          </div>
          <div className="mt-3">
            <Progress value={u.progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1 text-right">{Math.round(u.progress)}%</p>
          </div>
        </div>
      ))}
    </div>
  );
}
