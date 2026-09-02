'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useUploadProgress, type MediaProviderKey, type MediaResourceType, type MediaLibraryId } from '@/components/upload-progress-context';
import { Progress } from '@/components/ui/progress';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faArrowUpRightFromSquare, faCheckCircle, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { useEffect, useMemo, useRef, useState } from 'react';

const PROVIDER_LABEL: Record<MediaProviderKey, string> = {
  vercel: 'Vercel Blob',
  cloudinary: 'Cloudinary',
  appwrite: 'Appwrite',
  gumlet_video: 'Gumlet Video',
  gumlet_image: 'Gumlet Image',
};

// Map each provider to the admin page's media sub-tab it opens.
// Appwrite and Gumlet open their dedicated sub-tabs; Gumlet additionally
// picks Video vs Image internally (handled by the media library).
function providerToInnerTab(provider: MediaProviderKey): string {
  if (provider === 'appwrite') return 'appwrite';
  if (provider === 'gumlet_video' || provider === 'gumlet_image') return 'gumlet';
  return provider; // 'vercel' | 'cloudinary'
}

export default function UploadProgressNotification() {
  const {
    vercel, cloudinary, appwrite, gumlet_video, gumlet_image,
    activeMediaTab, clearFileName, completedUpload,
  } = useUploadProgress();
  const pathname = usePathname();
  const router = useRouter();

  const [completed, setCompleted] = useState<Array<{ provider: MediaProviderKey; fileName: string; resourceType?: MediaResourceType; docId?: string; libraryId?: MediaLibraryId; id: number }>>([]);
  const [dismissedActive, setDismissedActive] = useState<Array<MediaProviderKey>>([]);
  const nextId = useRef(0);
  const lastNotifiedId = useRef<string | null>(null);
  // DocIds the media library or media picker has already surfaced (e.g. via
  // highlight). The "Uploaded to ..." card for these is suppressed entirely
  // because the user has already seen the new file in its real location.
  const suppressedDocIds = useRef<Set<string>>(new Set());
  // Providers whose media surface (picker or full library dialog) is already
  // open. While open, any completed upload for that provider is surfaced
  // directly in-place and the global "Uploaded to ..." toast is noise.
  const openSurfaces = useRef<Set<MediaProviderKey>>(new Set());

const providerStates: Record<MediaProviderKey, { isUploading: boolean; progress: number; fileName: string }> = useMemo(() => ({
  vercel, cloudinary, appwrite, gumlet_video, gumlet_image,
}), [vercel, cloudinary, appwrite, gumlet_video, gumlet_image]);
  const providerKeys = Object.keys(PROVIDER_LABEL) as MediaProviderKey[];

  useEffect(() => {
    if (appwrite.isUploading && appwrite.fileName) {
      setDismissedActive(prev => prev.filter(p => p !== 'appwrite'));
    }
  }, [appwrite.isUploading, appwrite.fileName]);

  useEffect(() => {
    if (gumlet_video.isUploading && gumlet_video.fileName) {
      setDismissedActive(prev => prev.filter(p => p !== 'gumlet_video'));
    }
  }, [gumlet_video.isUploading, gumlet_video.fileName]);

  useEffect(() => {
    if (gumlet_image.isUploading && gumlet_image.fileName) {
      setDismissedActive(prev => prev.filter(p => p !== 'gumlet_image'));
    }
  }, [gumlet_image.isUploading, gumlet_image.fileName]);

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
      const detail = (e as CustomEvent<{ provider?: MediaProviderKey; mode?: string; docId?: string; tab?: string }>).detail;
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
    const highlighted = (e: Event) => {
      const detail = (e as CustomEvent<{ provider?: MediaProviderKey; docId?: string }>).detail;
      if (!detail?.provider) return;
      if (detail.docId) suppressedDocIds.current.add(detail.docId);
      setCompleted(prev => prev.filter((c) => {
        if (c.provider !== detail.provider) return true;
        if (detail.docId) return c.docId !== detail.docId;
        return false;
      }));
      setDismissedActive(prev => prev.includes(detail.provider as MediaProviderKey) ? prev : [...prev, detail.provider as MediaProviderKey]);
    };
    const opened = (e: Event) => {
      const detail = (e as CustomEvent<{ provider?: MediaProviderKey }>).detail;
      if (detail?.provider) openSurfaces.current.add(detail.provider);
    };
    const closed = (e: Event) => {
      const detail = (e as CustomEvent<{ provider?: MediaProviderKey }>).detail;
      if (detail?.provider) openSurfaces.current.delete(detail.provider);
    };
    window.addEventListener('media-upload-highlighted', highlighted);
    window.addEventListener('media-surface-opened', opened);
    window.addEventListener('media-surface-closed', closed);
    return () => {
      window.removeEventListener('media-upload-highlighted', highlighted);
      window.removeEventListener('media-surface-opened', opened);
      window.removeEventListener('media-surface-closed', closed);
    };
  }, []);

  // Create the "upload finished" card directly from the authoritative
  // `completedUpload` state (which now carries the fileName).
  useEffect(() => {
    if (!completedUpload) return;
    if (lastNotifiedId.current === completedUpload.docId) return;
    lastNotifiedId.current = completedUpload.docId;
    if (openSurfaces.current.has(completedUpload.provider)) return;
    if (suppressedDocIds.current.has(completedUpload.docId)) {
      suppressedDocIds.current.delete(completedUpload.docId);
      return;
    }
    const providerState = providerStates[completedUpload.provider];
    const fileName =
      completedUpload.fileName ||
      providerState.fileName ||
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
  }, [completedUpload, clearFileName, providerStates]);

  const dismiss = (id: number) => {
    setCompleted(prev => prev.filter(c => c.id !== id));
  };

  const goToMediaTab = (
    provider: MediaProviderKey,
    opts?: { resourceType?: MediaResourceType; docId?: string; libraryId?: MediaLibraryId }
  ) => {
    const tab = opts?.resourceType === 'video' ? 'videos' : opts?.resourceType === 'raw' ? 'files' : 'images';
    const mode = opts?.docId ? 'finished' : 'progress';
    const innerTab = providerToInnerTab(provider);
    const payload = { provider, mode, tab, docId: opts?.docId, library: opts?.libraryId };
    if (pathname === '/admin') {
      window.dispatchEvent(new CustomEvent('admin-goto-media', { detail: payload }));
    } else {
      const qs = new URLSearchParams({ tab: 'media', innerTab, mediaTab: tab });
      if (mode === 'finished' && opts?.docId) {
        qs.set('docId', opts.docId);
        if (opts.libraryId) qs.set('library', opts.libraryId);
        qs.set('mediaProvider', provider);
      }
      router.push(`/admin?${qs.toString()}`);
    }
  };

  const activeUploads = providerKeys
    .map((p) => ({ ...providerStates[p], key: p }))
    .filter((u) => u.isUploading && u.progress < 100)
    .map((u) => ({ isUploading: true, progress: u.progress, fileName: u.fileName, provider: u.key })) as Array<{ isUploading: boolean; progress: number; fileName: string; provider: MediaProviderKey }>;

  const visibleActiveUploads = activeUploads.filter((u) => {
    if (dismissedActive.includes(u.provider)) return false;
    if (pathname !== '/admin') return true;
    const tabForProvider = providerToInnerTab(u.provider);
    if (activeMediaTab === tabForProvider) return false;
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
                <p className="text-sm font-medium truncate">Uploading to {PROVIDER_LABEL[u.provider]}</p>
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
                <p className="text-sm font-medium truncate">Uploaded to {PROVIDER_LABEL[c.provider]}</p>
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