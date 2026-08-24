'use client';

import { usePathname } from 'next/navigation';
import { useUploadProgress } from '@/components/upload-progress-context';
import { Progress } from '@/components/ui/progress';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function UploadProgressNotification() {
  const { isUploading, progress, fileName, provider, activeMediaTab } = useUploadProgress();
  const pathname = usePathname();

  if (!isUploading) return null;

  // Hide the minimized notification when the user is on the Vercel upload section
  // (admin -> media -> vercel) where the inline progress is visible.
  // Show it when navigating to other pages or other tabs (cloudinary, other admin tabs).
  const isOnVercelUploadSection = pathname === '/admin' && activeMediaTab === 'vercel';
  if (isOnVercelUploadSection) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 glass-effect border rounded-lg p-4 shadow-2xl animate-in slide-in-from-bottom-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faCloudUploadAlt} className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">Uploading to {provider === 'vercel' ? 'Vercel Blob' : 'Cloudinary'}</p>
            <p className="text-xs text-muted-foreground truncate">{fileName}</p>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1 text-right">{Math.round(progress)}%</p>
      </div>
    </div>
  );
}
