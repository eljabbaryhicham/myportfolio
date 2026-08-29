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

  const [completed, setCompleted] = useState<Array<{ provider: 'vercel' | 'cloudinary'; fileName: string; resourceType?: 'image' | 'video' | 'raw'; docId?: string; libraryId?: 'primary' | 'extented' | 'vercel_blob'; id: number }>>([]);
  const [dismissedActive, setDismissedActive] = useState<Array<'vercel' | 'cloudinary'>>([]);
  const nextId = useRef(0);
  const lastNotifiedId = useRef<string | null>(null);

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

  // When the media library is opened for a downloaded file (via the arrow
  // button OR via direct navigation/notification click), dismiss the matching
  // completed card so the notification doesn't linger.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ provider?: 'vercel' | 'cloudinary'; mode?: string; docId?: string; tab?: string }>).detail;
      if (!detail?.provider) return;
      setCompleted(prev => prev.filter((c) => {
        if (c.provider !== detail.provider) return true;
        if (detail.docId) return c.docId !== detail.docId;
        return false;
      }));
    };
    window.addEventListener('admin-goto-media', handler);
    return () => window.removeEventListener('admin-goto-media', handler);
  }, []);

  // When the media library or media picker applies its highlight to the
  // finished upload, drop the matching "Uploaded" card so the notification
  // doesn't linger after the user has already seen the new file.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ provider?: 'vercel' | 'cloudinary'; docId?: string }>).detail;
      if (!detail?.provider) return;
      setCompleted(prev => prev.filter((c) => {
        if (c.provider !== detail.provider) return true;
        if (detail.docId) return c.docId !== detail.docId;
        return false;
      }));
    };
    window.addEventListener('media-upload-highlighted', handler);
    return () => window.removeEventListener('media-upload-highlighted', handler);
  }, []);

  // Create the "upload finished" card directly from the authoritative
  // `completedUpload` state (which now carries the fileName). The old approach
  // reacted to the isUploading->false transition, but that raced with the async
  // Firestore write + signalCompletedUpload, so the card was never shown.
  useEffect(() => {
    if (!completedUpload) return;
    if (lastNotifiedId.current === completedUpload.docId) return;
    lastNotifiedId.current = completedUpload.docId;
    const fileName =
      completedUpload.fileName ||
      (completedUpload.provider === 'vercel' ? vercel.fileName : cloudinary.fileName) ||
      'Uploaded file';
    setCompleted(prev => [...prev, {
      provider: completedUpload.provider,
      fileName,
      resourceType: completedUpload.resourceType,
      docId: completedUpload.docId,
      libraryId: completedUpload.libraryId,
      id: nextId.current++,
    }]);
    clearFileName(completedUpload.provider);
  }, [completedUpload, clearFileName, vercel.fileName, cloudinary.fileName]);

  const dismiss = (id: number) => {
    setCompleted(prev => prev.filter(c => c.id !== id));
  };

  const goToMediaTab = (
    provider: 'vercel' | 'cloudinary',
    opts?: { resourceType?: 'image' | 'video' | 'raw'; docId?: string; libraryId?: string }
  ) => {
    const tab = opts?.resourceType === 'video' ? 'videos' : opts?.resourceType === 'raw' ? 'files' : 'images';
    // Progress mode (no docId yet): just switch to the provider tab.
    // Finished mode (docId present): also open the library and highlight the file.
    const mode = opts?.docId ? 'finished' : 'progress';
    const payload = { provider, mode, tab, docId: opts?.docId, library: opts?.libraryId };
    if (pathname === '/admin') {
      // Already on the admin page: switch via an event (no full reload), so an
      // in-flight upload is NOT aborted. The admin page forwards finished ones
      // to the media library to highlight the downloaded file.
      window.dispatchEvent(new CustomEvent('admin-goto-media', { detail: payload }));
    } else {
      // Navigate from elsewhere: use query params so the admin page switches on mount.
      const qs = new URLSearchParams({ tab: 'media', innerTab: provider, mediaTab: tab });
      if (mode === 'finished' && opts?.docId) {
        qs.set('docId', opts.docId);
        if (opts.libraryId) qs.set('library', opts.libraryId);
      }
      router.push(`/admin?${qs.toString()}`);
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
                onClick={() => { dismiss(c.id); goToMediaTab(c.provider, { resourceType: c.resourceType, docId: c.docId, libraryId: c.libraryId }); }}
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
