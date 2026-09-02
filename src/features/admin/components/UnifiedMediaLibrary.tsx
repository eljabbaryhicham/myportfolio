'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useUser, useFirestore } from '@/firebase';
import type { AppUser } from '@/firebase/auth/use-user';
import { isSuperAdmin } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import Preloader from '@/components/preloader';
import { useProviderMedia } from '@/features/admin/hooks/use-provider-media';
import type { MediaLibraryAsset } from '@/features/admin/lib/media-asset';
import type { MediaMetaTag } from '@/lib/media-meta';
import type { MediaProvider } from '@/lib/media-providers';
import { DEFAULT_RETRY_CONFIG, shouldRetry, calculateRetryDelay } from '@/lib/upload-retry';
import { setDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where, getDocs, writeBatch } from 'firebase/firestore';
import BulkActionBar from './BulkActionBar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCloudUploadAlt,
  faCopy,
  faEye,
  faFileImage,
  faFileLines,
  faFilm,
  faFolderOpen,
  faLink,
  faMinus,
  faPhotoFilm,
  faSpinner,
  faTag,
  faTrash,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

const TAG_COLORS: Record<MediaMetaTag, string> = {
  green: 'bg-green-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  blue: 'bg-blue-500',
};

const TAG_TEXT_COLORS: Record<MediaMetaTag, string> = {
  green: 'text-green-500',
  red: 'text-red-500',
  orange: 'text-orange-500',
  blue: 'text-blue-500',
};

const TAG_LABELS: Record<MediaMetaTag, string> = {
  green: 'Green',
  red: 'Red',
  orange: 'Orange',
  blue: 'Blue',
};

type AssetTab = 'images' | 'videos' | 'files';

function tabOfType(type: string): AssetTab {
  return type === 'image' ? 'images' : type === 'video' ? 'videos' : 'files';
}

function formatOptionsFor(provider: MediaProvider): string[] {
  if (provider === 'gumlet_image') return ['original', 'webp', 'avif', 'jpg', 'png'];
  if (provider === 'gumlet_video') return ['original', 'mp4', 'hls'];
  return ['original'];
}

type ManagedProvider = 'appwrite' | 'gumlet_video' | 'gumlet_image';

type FailedUpload = {
  id: number;
  label: string;
  target: ManagedProvider;
  kind: 'file' | 'link';
  file?: File;
  url?: string;
  filename?: string;
  format?: 'ABR' | 'MP4';
  error: string;
  retryCount: number;
};

export default function UnifiedMediaLibrary({ provider }: { provider: ManagedProvider }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<AssetTab>('images');
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<MediaLibraryAsset | null>(null);
  const [isAddFromUrlOpen, setIsAddFromUrlOpen] = useState(false);
  const [isFullLibraryOpen, setIsFullLibraryOpen] = useState(false);
  const [gumletChoiceOpen, setGumletChoiceOpen] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<{ kind: 'file'; file: File } | { kind: 'link'; url: string; filename?: string } | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const firestore = useFirestore();

  // Bulk select / delete state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Set-as-background state
  const [isSetBackgroundOpen, setIsSetBackgroundOpen] = useState(false);
  const [backgroundTarget, setBackgroundTarget] = useState<'home' | 'website'>('home');
  const [backgroundAsset, setBackgroundAsset] = useState<MediaLibraryAsset | null>(null);

  // Failed uploads for retry
  const [failedUploads, setFailedUploads] = useState<FailedUpload[]>([]);

  // Surface-open/closed events: while the full library dialog is open, the
  // global "Uploaded to ..." notification is suppressed (the new file is shown
  // in-place), exactly like the Cloudinary/Vercel media libraries.
  useEffect(() => {
    if (!isFullLibraryOpen) return;
    window.dispatchEvent(new CustomEvent('media-surface-opened', {
      detail: { provider },
    }));
    return () => {
      window.dispatchEvent(new CustomEvent('media-surface-closed', {
        detail: { provider },
      }));
    };
  }, [isFullLibraryOpen, provider]);

  // Best-effort highlight: when the global upload notification (or the admin
  // page) asks to jump to an uploaded file for this provider, open the full
  // library, switch to the matching provider/tab, and briefly highlight the
  // asset with that id (if present).
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ provider?: string; docId?: string; tab?: string }>).detail;
      if (!detail?.provider || !detail.docId) return;
      const appliesHere =
        provider === 'appwrite'
          ? detail.provider === 'appwrite'
          : (provider === 'gumlet_video' || provider === 'gumlet_image') &&
            (detail.provider === 'gumlet_video' || detail.provider === 'gumlet_image');
      if (!appliesHere) return;
      // Gumlet: pick the matching Video/Image mode for the uploaded asset.
      if ((provider === 'gumlet_video' || provider === 'gumlet_image') && (detail.provider === 'gumlet_video' || detail.provider === 'gumlet_image')) {
        setGumletMode(detail.provider === 'gumlet_video' ? 'video' : 'image');
      }
      setActiveTab((detail.tab as AssetTab) || 'images');
      setHighlightId(detail.docId);
      setIsFullLibraryOpen(true);
      // Notify the global notification to suppress its "Uploaded to ..." card,
      // since the new file is highlighted in-place here (same as Cloudinary/Vercel).
      window.dispatchEvent(new CustomEvent('media-upload-highlighted', {
        detail: { provider: detail.provider, docId: detail.docId },
      }));
      const timer = setTimeout(() => setHighlightId(null), 3000);
      return () => clearTimeout(timer);
    };
    window.addEventListener('media-managed-highlight', handler);
    return () => window.removeEventListener('media-managed-highlight', handler);
  }, [provider]);

  const isGumlet = provider === 'gumlet_video' || provider === 'gumlet_image';
  const [gumletMode, setGumletMode] = useState<'video' | 'image'>(
    provider === 'gumlet_image' ? 'image' : 'video'
  );
  const effectiveProvider: ManagedProvider = isGumlet
    ? gumletMode === 'image' ? 'gumlet_image' : 'gumlet_video'
    : provider;

  const typedUser = user as AppUser | null;
  const canUpload = isSuperAdmin(typedUser) || (typedUser?.permissions?.canUploadMedia ?? false);
  const canDelete = isSuperAdmin(typedUser) || (typedUser?.permissions?.canDeleteMedia ?? false);
  const canEditHome = isSuperAdmin(typedUser) || (typedUser?.permissions?.canEditHome ?? false);

  const showBulkSelect = canDelete;

  const appwriteMedia = useProviderMedia('appwrite');
  const gumletVideoMedia = useProviderMedia('gumlet_video');
  const gumletImageMedia = useProviderMedia('gumlet_image');
  const mediaByProvider: Record<ManagedProvider, ReturnType<typeof useProviderMedia>> = useMemo(
    () => ({
      appwrite: appwriteMedia,
      gumlet_video: gumletVideoMedia,
      gumlet_image: gumletImageMedia,
    }),
    [appwriteMedia, gumletVideoMedia, gumletImageMedia]
  );
  const media = mediaByProvider[effectiveProvider];
  const { capabilities, isUploading, cancelUpload } = media;
  const formatOptions = useMemo(() => formatOptionsFor(effectiveProvider), [effectiveProvider]);

  // ---- Perform a file upload (used for direct Appwrite and Gumlet choice) ----
  const performFileUpload = useCallback(
    async (file: File, targetProvider: ManagedProvider) => {
      const targetMedia = mediaByProvider[targetProvider];
      const result = await targetMedia.uploadFile(file);
      if (result.ok) {
        toast({ title: 'Uploaded', description: file.name });
        setGumletMode(targetProvider === 'gumlet_image' ? 'image' : 'video');
        setActiveTab(tabOfType(file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'image' : 'raw'));
        targetMedia.refresh();
      } else if (result.error && result.error !== 'Upload cancelled.') {
        toast({ variant: 'destructive', title: 'Upload failed', description: result.error });
      }
    },
    [mediaByProvider, toast]
  );

  const nextFailedIdRef = useRef(0);

  // ---- Record a failed upload for the retry panel ----
  const addFailedUpload = useCallback((task: Omit<FailedUpload, 'id' | 'error' | 'retryCount'> & { error: string }) => {
    const id = ++nextFailedIdRef.current;
    setFailedUploads((prev) => [...prev, { ...task, id, retryCount: 0 }]);
  }, []);

  // ---- Run an upload task and record it on failure (no auto-retry) ----
  const runTask = useCallback(
    async (task: Omit<FailedUpload, 'id' | 'error' | 'retryCount'>) => {
      const targetMedia = mediaByProvider[task.target];
      if (task.kind === 'file' && task.file) {
        const result = await targetMedia.uploadFile(task.file);
        if (!result.ok && result.error && result.error !== 'Upload cancelled.') {
          addFailedUpload({ ...task, error: result.error });
          return false;
        }
        if (result.ok) {
          setGumletMode(task.target === 'gumlet_image' ? 'image' : 'video');
          setActiveTab(tabOfType(task.file.type.startsWith('video/') ? 'video' : task.file.type.startsWith('image/') ? 'image' : 'raw'));
          targetMedia.refresh();
        }
      } else if (task.kind === 'link' && task.url) {
        const result = await targetMedia.uploadByLink(task.url, task.filename, task.target === 'gumlet_video' ? task.format : undefined);
        if (!result.ok && result.error && result.error !== 'Upload cancelled.') {
          addFailedUpload({ ...task, error: result.error });
          return false;
        }
        if (result.ok) {
          setGumletMode(task.target === 'gumlet_image' ? 'image' : 'video');
          setActiveTab(task.target === 'gumlet_video' ? 'videos' : 'images');
          targetMedia.refresh();
        }
      }
      return true;
    },
    [mediaByProvider, addFailedUpload]
  );

  // ---- Retry a single failed upload with backoff (mirrors Cloudinary) ----
  const retryUploadItem = useCallback(
    async (item: FailedUpload) => {
      if (!shouldRetry(item.retryCount, new Error(item.error), DEFAULT_RETRY_CONFIG)) {
        toast({ variant: 'destructive', title: 'Max retries exceeded', description: 'Please try uploading again manually.' });
        return;
      }
      const delay = calculateRetryDelay(item.retryCount, DEFAULT_RETRY_CONFIG);
      toast({ title: `Retrying in ${Math.round(delay / 1000)}s...`, description: `Attempt ${item.retryCount + 1} of ${DEFAULT_RETRY_CONFIG.maxRetries}` });
      await new Promise((resolve) => setTimeout(resolve, delay));
      const targetMedia = mediaByProvider[item.target];
      let ok = false;
      if (item.kind === 'file' && item.file) {
        const result = await targetMedia.uploadFile(item.file);
        ok = result.ok;
        if (result.ok) {
          setGumletMode(item.target === 'gumlet_image' ? 'image' : 'video');
          setActiveTab(tabOfType(item.file.type.startsWith('video/') ? 'video' : item.file.type.startsWith('image/') ? 'image' : 'raw'));
          targetMedia.refresh();
        }
      } else if (item.kind === 'link' && item.url) {
        const result = await targetMedia.uploadByLink(item.url, item.filename, item.target === 'gumlet_video' ? item.format : undefined);
        ok = result.ok;
        if (result.ok) {
          setGumletMode(item.target === 'gumlet_image' ? 'image' : 'video');
          setActiveTab(item.target === 'gumlet_video' ? 'videos' : 'images');
          targetMedia.refresh();
        }
      }
      setFailedUploads((prev) => prev.map((f) => (f.id === item.id ? { ...f, retryCount: f.retryCount + 1 } : f)));
      if (ok) {
        const finalCount = item.retryCount + 1;
        const maxed = finalCount >= DEFAULT_RETRY_CONFIG.maxRetries;
        setFailedUploads((prev) => (maxed ? prev.filter((f) => f.id !== item.id) : prev));
      }
    },
    [mediaByProvider, toast]
  );

  const retryAllFailed = useCallback(() => {
    failedUploads.forEach((item) => void retryUploadItem(item));
  }, [failedUploads, retryUploadItem]);

  // ---- Dropzone (drag & drop) ----
  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (accepted.length === 0) return;
      if (isGumlet) {
        // Keep the existing single-choice flow for drag & drop on Gumlet.
        setPendingUpload({ kind: 'file', file: accepted[0] });
        setGumletChoiceOpen(true);
        return;
      }
      // Multi-file queue: process all dropped files sequentially for Appwrite.
      for (const file of accepted) {
        await runTask({ kind: 'file', target: 'appwrite', label: file.name, file });
      }
    },
    [isGumlet, runTask]
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: undefined, disabled: !canUpload || isUploading, multiple: true,
  });

  const pickFile = useCallback(
    async (file: File) => {
      if (!file) return;
      if (isGumlet) {
        setPendingUpload({ kind: 'file', file });
        setGumletChoiceOpen(true);
        return;
      }
      await runTask({ kind: 'file', target: 'appwrite', label: file.name, file });
    },
    [isGumlet, runTask]
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const copy = useCallback(
    async (asset: MediaLibraryAsset, formatKey: string) => {
      const url = media.copyUrl(asset, formatKey);
      try {
        await navigator.clipboard.writeText(url);
        toast({ title: 'Link copied', description: formatKey === 'original' ? 'Original URL copied.' : `${formatKey.toUpperCase()} URL copied.` });
      } catch {
        toast({ variant: 'destructive', title: 'Could not copy link' });
      }
    },
    [media, toast]
  );

  const setTag = useCallback((asset: MediaLibraryAsset, tag: MediaMetaTag | null) => {
    void media.setTag(asset, tag);
    if (tag) toast({ title: 'Tag updated' }); else toast({ title: 'Tag removed' });
  }, [media, toast]);

  const deleteAsset = useCallback(
    async (asset: MediaLibraryAsset) => {
      const result = await media.deleteAsset(asset);
      if (result.ok) {
        toast({ title: 'Deleted' });
        if (preview?.id === asset.id) setPreview(null);
      } else {
        toast({ variant: 'destructive', title: 'Delete failed', description: result.error });
      }
    },
    [media, toast, preview]
  );

  const remove = useCallback(
    (asset: MediaLibraryAsset) => {
      if (window.confirm(`Delete "${asset.filename}"? This cannot be undone.`)) {
        void deleteAsset(asset);
      }
    },
    [deleteAsset]
  );

  // ---- Bulk select ----
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // ---- Bulk delete (single asset delete per selected id, sequential) ----
  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const selectedAssets = media.assets.filter((a) => selectedIds.has(a.id));
    let failedCount = 0;
    for (const asset of selectedAssets) {
      const result = await media.deleteAsset(asset);
      if (!result.ok) failedCount += 1;
    }
    setSelectedIds(new Set());
    setIsBulkDeleteOpen(false);
    toast({
      title: failedCount === 0 ? 'Deleted' : 'Some files could not be deleted',
      description: failedCount === 0 ? `Deleted ${selectedAssets.length} files.` : `${selectedAssets.length - failedCount} of ${selectedAssets.length} deleted.`,
      variant: failedCount === 0 ? 'default' : 'destructive',
    });
  }, [selectedIds, media, toast]);

  // ---- Set as background ----
  const handleOpenSetBackgroundDialog = useCallback((asset: MediaLibraryAsset) => {
    if (!canEditHome) return;
    setBackgroundAsset(asset);
    setBackgroundTarget('home');
    setIsSetBackgroundOpen(true);
  }, [canEditHome]);

  const handleConfirmSetBackground = useCallback(async () => {
    if (!firestore || !backgroundAsset || !canEditHome) return;
    let mediaIdForDb = backgroundAsset.id;
    const mediaTypeForDb = backgroundAsset.resourceType === 'video' ? 'video' : 'image';
    if (mediaTypeForDb === 'video') {
      try {
        const projectsRef = collection(firestore, 'projects');
        const q = query(projectsRef, where('sourceUrl', '==', backgroundAsset.url));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          mediaIdForDb = querySnapshot.docs[0].id;
        } else {
          const newProjectRef = doc(projectsRef);
          mediaIdForDb = newProjectRef.id;
          const batch = writeBatch(firestore);
          const title = (backgroundAsset.filename || 'New Background Project').split('.').slice(0, -1).join('.') || 'New Background Project';
          batch.set(newProjectRef, {
            title,
            description: 'Automatically created for background video.',
            type: 'video',
            sourceUrl: backgroundAsset.url,
            thumbnailUrl: backgroundAsset.url.replace(/\.(mp4|m3u8|webm)$/, '.jpg'),
            isVisible: false,
            order: 999,
          });
          await batch.commit();
        }
      } catch {
        // Background image fallback still works even if the video project
        // could not be created (e.g. no projects collection permission).
      }
    }
    const settingsDocRef = doc(firestore, 'homepage', 'settings');
    const fieldToUpdateId = backgroundTarget === 'home' ? 'homePageBackgroundMediaId' : 'websiteBackgroundMediaId';
    const fieldToUpdateType = backgroundTarget === 'home' ? 'homePageBackgroundType' : 'websiteBackgroundType';
    const fieldToUpdateUrl = backgroundTarget === 'home' ? 'homePageBackgroundUrl' : 'websiteBackgroundUrl';
    setDocumentNonBlocking(settingsDocRef, {
      [fieldToUpdateId]: mediaIdForDb,
      [fieldToUpdateType]: mediaTypeForDb,
      [fieldToUpdateUrl]: backgroundAsset.url,
    }, { merge: true });
    toast({ title: 'Background updated', description: `${backgroundTarget === 'home' ? 'Homepage' : 'Other pages'} background set.` });
    setIsSetBackgroundOpen(false);
  }, [firestore, backgroundAsset, canEditHome, backgroundTarget, toast]);

  const grid = useCallback(
    (tab: AssetTab) => {
      const q = search.trim().toLowerCase();
      const items = media.assets.filter((a) => {
        const tabOk = tabOfType(a.resourceType) === tab;
        return tabOk && (!q || a.filename?.toLowerCase().includes(q) || a.url.toLowerCase().includes(q));
      });
      if (media.isLoading) {
        return <div className="flex justify-center items-center h-full min-h-[200px]"><Preloader /></div>;
      }
      if (items.length === 0) {
        const typeName = tab === 'images' ? 'images' : tab === 'videos' ? 'videos' : 'files';
        return (
          <div className="text-center py-12 text-muted-foreground">
            <FontAwesomeIcon icon={tab === 'images' ? faFileImage : tab === 'videos' ? faFilm : faFileLines} className="h-12 w-12 mb-4" />
            <p>No {typeName} found.</p>
          </div>
        );
      }
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map((asset) => (
            <FileCard
              key={asset.id}
              asset={asset}
              formatOptions={formatOptions}
              canDelete={canDelete}
              canEditHome={canEditHome}
              isHighlighted={highlightId === asset.id}
              isSelected={selectedIds.has(asset.id)}
              showCheckbox={showBulkSelect}
              onToggleSelect={handleToggleSelect}
              onPreview={setPreview}
              onCopy={copy}
              onSetTag={setTag}
              onDelete={deleteAsset}
              onSetBackground={handleOpenSetBackgroundDialog}
            />
          ))}
        </div>
      );
    },
    [media.assets, media.isLoading, search, canDelete, canEditHome, formatOptions, copy, setTag, deleteAsset, highlightId, selectedIds, showBulkSelect, handleToggleSelect, handleOpenSetBackgroundDialog]
  );

  // ---- Compact upload strip for the popup dialog (mirrors Cloudinary) ----
  const dialogUploadStrip = (
    <div className="px-4 pt-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div
          {...getRootProps()}
          className={cn(
            'flex-1 border border-dashed rounded-md px-3 py-2 flex items-center justify-center gap-2 cursor-pointer transition-colors text-muted-foreground min-w-0',
            isDragActive && canUpload ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50',
            (!canUpload || isUploading) && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input {...getInputProps()} disabled={!canUpload || isUploading} />
          <FontAwesomeIcon icon={faCloudUploadAlt} className="h-4 w-4 shrink-0" />
          <span className="text-xs md:text-sm truncate text-center">
            {isUploading ? 'Uploading…' : !canUpload ? 'No permission' : capabilities.canUploadFile === false ? 'Add from URL to import' : 'Drag & drop or click to upload'}
          </span>
        </div>
        <Button onClick={() => setIsAddFromUrlOpen(true)} variant="outline" size="sm" disabled={!canUpload || isUploading} className="w-full sm:w-auto justify-center shrink-0">
          <FontAwesomeIcon icon={faLink} className="mr-2" />
          Add from URL
        </Button>
      </div>
      {isUploading && (
        <div className="mt-2 flex items-center gap-2 min-w-0">
          <Progress value={media.uploadProgress} className="flex-1" />
          <span className="text-xs text-muted-foreground truncate max-w-[45%]">
            {media.uploadFileName} — {Math.round(media.uploadProgress)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={cancelUpload}
            title="Cancel upload"
            className="text-destructive hover:bg-destructive/10 shrink-0"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );

  // ---- Upload strip (mirrors Cloudinary) ----
  const uploadStrip = (
    <div className="flex flex-col gap-4">
      <div
        {...getRootProps()}
        className={cn(
          'flex-1 border-2 border-dashed rounded-lg p-6 text-center transition-colors relative cursor-pointer',
          isDragActive && canUpload ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50',
          (!canUpload || isUploading) && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} disabled={!canUpload || isUploading} />
        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <FontAwesomeIcon icon={faCloudUploadAlt} className="h-8 w-8" />
          {isUploading ? (
            <p className="text-sm">Uploading…</p>
          ) : !canUpload ? (
            <p className="text-sm text-destructive-foreground/70">No permission to upload</p>
          ) : (
            <p className="text-sm">Drag &amp; drop or click to upload</p>
          )}
          {capabilities.canUploadFile === false && !isUploading && canUpload && (
            <p className="text-xs text-muted-foreground">This library uses link import.</p>
          )}
        </div>
      </div>
      <Button onClick={() => setIsAddFromUrlOpen(true)} variant="outline" size="sm" className="w-full" disabled={!canUpload || isUploading}>
        <FontAwesomeIcon icon={faLink} className="mr-2" />
        Add from URL
      </Button>
      {isUploading && (
        <div className="mt-1">
          <div className="flex items-center gap-2">
            <Progress value={media.uploadProgress} className="flex-1" />
            <Button
              variant="ghost"
              size="icon"
              onClick={cancelUpload}
              title="Cancel upload"
              className="text-destructive hover:bg-destructive/10"
            >
              <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-center mt-2 text-muted-foreground">
            {media.uploadFileName} — {Math.round(media.uploadProgress)}%
          </p>
        </div>
      )}
      {canUpload && capabilities.canUploadFile && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; e.currentTarget.value = ''; if (f) void pickFile(f); }}
          />
        </>
      )}
      {failedUploads.length > 0 && (
        <div className="mt-4 space-y-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm font-medium text-destructive">
            {failedUploads.length} upload{failedUploads.length > 1 ? 's' : ''} failed
          </p>
          <div className="space-y-2">
            {failedUploads.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate flex-1">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Attempt {item.retryCount}/{DEFAULT_RETRY_CONFIG.maxRetries}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void retryUploadItem(item)}
                    disabled={!shouldRetry(item.retryCount, new Error(item.error), DEFAULT_RETRY_CONFIG)}
                    className="h-8 px-3"
                  >
                    <FontAwesomeIcon icon={faSpinner} className="mr-1 h-3 w-3" /> Retry
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {failedUploads.length > 1 && (
            <Button variant="outline" size="sm" onClick={retryAllFailed} className="w-full mt-2">
              Retry All
            </Button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <section className="flex h-full flex-col gap-6">
      <div className="flex items-start justify-between">
        <div className="text-left">
          <h2 className="text-xl font-headline">Media Library</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {provider === 'appwrite' ? 'Appwrite storage media.' : provider === 'gumlet_video' ? 'Gumlet video media.' : 'Gumlet image media.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsFullLibraryOpen(true)} variant="outline" size="sm">
            <FontAwesomeIcon icon={faFolderOpen} className="mr-2" />
            Browse full library
          </Button>
        </div>
      </div>
      <Separator className="bg-white/10" />
      <div className="border rounded-lg p-6 glass-effect flex flex-col gap-4">
        {uploadStrip}
      </div>

      <Dialog open={isFullLibraryOpen} onOpenChange={setIsFullLibraryOpen}>
        <DialogContent className="glass-effect p-0 flex flex-col w-[80vw] h-[90vh]">
          <DialogHeader className="p-4 border-b text-center">
            <DialogTitle className="font-headline">Media Library</DialogTitle>
            <DialogDescription>
              {provider === 'appwrite' ? 'Appwrite storage media.' : provider === 'gumlet_video' ? 'Gumlet video media.' : 'Gumlet image media.'}
            </DialogDescription>
          </DialogHeader>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AssetTab)} className="flex-1 flex flex-col min-h-0">
            {isGumlet && (
              <Tabs value={gumletMode} onValueChange={(v) => setGumletMode(v as 'video' | 'image')} className="px-4 pt-4">
                <TabsList>
                  <TabsTrigger value="video" className="py-2 px-4 text-base glass-effect data-[state=active]:bg-destructive"><FontAwesomeIcon icon={faFilm} className="mr-2" />Video</TabsTrigger>
                  <TabsTrigger value="image" className="py-2 px-4 text-base glass-effect data-[state=active]:bg-destructive"><FontAwesomeIcon icon={faFileImage} className="mr-2" />Image</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            <div className="px-4 pt-4 flex items-center gap-2 flex-wrap">
              <TabsList>
                <TabsTrigger value="images" className="py-2 px-4 text-base glass-effect data-[state=active]:bg-destructive"><FontAwesomeIcon icon={faFileImage} className="mr-2" />Images</TabsTrigger>
                <TabsTrigger value="videos" className="py-2 px-4 text-base glass-effect data-[state=active]:bg-destructive"><FontAwesomeIcon icon={faFilm} className="mr-2" />Videos</TabsTrigger>
                <TabsTrigger value="files" className="py-2 px-4 text-base glass-effect data-[state=active]:bg-destructive"><FontAwesomeIcon icon={faFileLines} className="mr-2" />Files</TabsTrigger>
              </TabsList>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="max-w-[220px] md:max-w-xs ml-auto glass-effect" />
            </div>
            {dialogUploadStrip}
            <ScrollArea className="flex-1">
              <TabsContent value="images" className="p-4 m-0">{grid('images')}</TabsContent>
              <TabsContent value="videos" className="p-4 m-0">{grid('videos')}</TabsContent>
              <TabsContent value="files" className="p-4 m-0">{grid('files')}</TabsContent>
            </ScrollArea>
            {showBulkSelect && (
              <BulkActionBar
                selectedCount={selectedIds.size}
                onClearSelection={() => setSelectedIds(new Set())}
                onDelete={() => setIsBulkDeleteOpen(true)}
                className="!relative !bottom-auto !left-auto !translate-x-0 mx-4 mb-4"
              />
            )}
          </Tabs>
          <DialogClose asChild>
            <button className={cn(
              'absolute right-4 top-4 h-8 w-8',
              'flex items-center justify-center rounded-full transition-opacity',
              'bg-destructive text-destructive-foreground opacity-70 hover:opacity-100',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'disabled:pointer-events-none'
            )}>
              <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {isGumlet && (
        <Dialog open={gumletChoiceOpen} onOpenChange={setGumletChoiceOpen}>
          <DialogContent className="w-[80vw] max-w-md glass-effect">
            <GumletChooseDialogContent
              pending={pendingUpload}
              onCancel={() => { setGumletChoiceOpen(false); setPendingUpload(null); }}
              onConfirm={async (targetProvider, format) => {
                setGumletChoiceOpen(false);
                setPendingUpload(null);
                if (!pendingUpload) return;
                try {
                  if (pendingUpload.kind === 'file') {
                    await performFileUpload(pendingUpload.file, targetProvider);
                  } else {
                    const target = mediaByProvider[targetProvider];
                    const result = await target.uploadByLink(pendingUpload.url, pendingUpload.filename, targetProvider === 'gumlet_video' ? format : undefined);
                    if (result.ok) {
                      toast({ title: 'Imported' });
                      setGumletMode(targetProvider === 'gumlet_image' ? 'image' : 'video');
                      setActiveTab(targetProvider === 'gumlet_video' ? 'videos' : 'images');
                      target.refresh();
                    } else {
                      toast({ variant: 'destructive', title: 'Import failed', description: result.error });
                    }
                  }
                } catch (error) {
                  toast({ variant: 'destructive', title: 'Failed', description: error instanceof Error ? error.message : 'Unexpected error.' });
                }
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      <AddFromUrlDialog
        isOpen={isAddFromUrlOpen}
        onOpenChange={setIsAddFromUrlOpen}
        onImport={async (url, filename) => {
          if (isGumlet) {
            setPendingUpload({ kind: 'link', url, filename });
            setIsAddFromUrlOpen(false);
            setGumletChoiceOpen(true);
            return { ok: true };
          }
          const result = await appwriteMedia.uploadByLink(url, filename);
          if (result.ok) {
            setActiveTab('images');
            appwriteMedia.refresh();
          }
          return result;
        }}
      />

      <Dialog open={!!preview} onOpenChange={(open) => { if (!open) setPreview(null); }}>
        <DialogContent className="w-[95vw] max-w-5xl h-[90vh] glass-effect p-0 flex flex-col overflow-hidden">
          {preview && (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b bg-black/40">
                <p className="text-sm font-medium truncate">{preview.filename}</p>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => void copy(preview, 'original')}><FontAwesomeIcon icon={faCopy} className="mr-2" />Copy URL</Button>
                  {canDelete && <Button size="sm" variant="destructive" onClick={() => void remove(preview)}><FontAwesomeIcon icon={faTrash} className="mr-2" />Delete</Button>}
                </div>
              </div>
              <div className="flex-1 min-h-0 bg-black">
                {preview.resourceType === 'image' ? (
                  <div className="relative w-full h-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview.url} alt={preview.filename} className="w-full h-full object-contain" />
                  </div>
                ) : preview.url ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <video src={preview.url} controls className="max-h-full max-w-full rounded bg-black" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-center text-white/70">
                    <div>
                      <FontAwesomeIcon icon={faFileLines} className="h-12 w-12 mb-2" />
                      <p className="text-sm">{preview.filename}</p>
                    </div>
                  </div>
                )}
              </div>
              <DialogClose asChild>
                <button className={cn(
                  'absolute right-4 top-4 h-8 w-8',
                  'flex items-center justify-center rounded-full transition-opacity',
                  'bg-destructive text-destructive-foreground opacity-70 hover:opacity-100',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  'disabled:pointer-events-none bg-transparent'
                )}>
                  <FontAwesomeIcon icon={faXmark} className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </button>
              </DialogClose>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent className="w-[80vw] glass-effect">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete selected files?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete {selectedIds.size} selected file(s). This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleBulkDelete()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isSetBackgroundOpen} onOpenChange={setIsSetBackgroundOpen}>
        <DialogContent className="w-[80vw] glass-effect">
          <DialogHeader>
            <DialogTitle>Set as background</DialogTitle>
            <DialogDescription>Choose where this media should be used as the page background.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup defaultValue="home" value={backgroundTarget} onValueChange={(value: 'home' | 'website') => setBackgroundTarget(value)}>
              <div className="flex items-center space-x-2"><RadioGroupItem value="home" id="bg-home" /><Label htmlFor="bg-home">Homepage only</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="website" id="bg-website" /><Label htmlFor="bg-website">Other pages</Label></div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSetBackgroundOpen(false)}>Cancel</Button>
            <Button onClick={() => void handleConfirmSetBackground()}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Add-from-URL dialog (mirrors Cloudinary's AddFromUrlDialog)
// ---------------------------------------------------------------------------

function AddFromUrlDialog({
  isOpen,
  onOpenChange,
  onImport,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (url: string, filename?: string) => Promise<{ ok: boolean; url?: string; error?: string }>;
}) {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleClose = (open: boolean) => {
    if (!open && !isSubmitting) {
      setUrl('');
      setProgress(0);
    }
    onOpenChange(open);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isSubmitting) return;
    if (!/^https?:\/\//i.test(url.trim())) {
      toast({ variant: 'destructive', title: 'Invalid URL', description: 'Please enter a valid http(s) URL.' });
      return;
    }
    setIsSubmitting(true);
    setProgress(15);
    const filename = url.split('/').pop()?.split('?')[0] || 'file';
    // No real server-side progress signal; step up so the popup feels responsive.
    const timer = window.setInterval(() => setProgress((p) => (p >= 90 ? p : p + 5)), 250);
    try {
      const result = await onImport(url.trim(), filename);
      window.clearInterval(timer);
      if (result.ok) {
        setProgress(100);
        toast({ title: 'Imported' });
        window.setTimeout(() => handleClose(false), 400);
      } else {
        setProgress(0);
        toast({ variant: 'destructive', title: 'Import failed', description: result.error || 'Could not import the URL.' });
      }
    } catch (error) {
      window.clearInterval(timer);
      toast({ variant: 'destructive', title: 'Import failed', description: error instanceof Error ? error.message : 'Unexpected error.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[80vw] max-w-md glass-effect">
        <DialogHeader>
          <DialogTitle>Add from URL</DialogTitle>
          <DialogDescription>Import an image, video, or file from an external URL.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset disabled={isSubmitting} className="space-y-4">
            <div className="space-y-2">
              <Label>Media URL</Label>
              <Input value={url} placeholder="https://example.com/file.png" onChange={(e) => setUrl(e.target.value)} />
            </div>
          </fieldset>
          {isSubmitting && (
            <div className="space-y-2 pt-4 text-center">
              <p className="text-sm text-muted-foreground">Importing…</p>
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
            </div>
          )}
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>{isSubmitting ? 'Minimize' : 'Cancel'}</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting && <FontAwesomeIcon icon={faSpinner} className="mr-2 h-4 w-4 animate-spin" />}{isSubmitting ? 'Importing' : 'Add to Library'}</Button>
          </DialogFooter>
        </form>
        {isSubmitting ? (
          <button
            onClick={() => handleClose(false)}
            className={cn('absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-70 transition-opacity hover:opacity-100')}
          >
            <FontAwesomeIcon icon={faMinus} className="h-4 w-4" />
            <span className="sr-only">Minimize</span>
          </button>
        ) : (
          <DialogClose asChild>
            <button className={cn('absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-70 transition-opacity hover:opacity-100')}>
              <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </DialogClose>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Gumlet choose-settings dialog (mirrors Cloudinary's choose-upload-settings)
// Appears after choosing a file or link; picks Video or Image (+ format).
// ---------------------------------------------------------------------------

type PendingGumletUpload =
  | { kind: 'file'; file: File }
  | { kind: 'link'; url: string; filename?: string };

function GumletChooseDialogContent({
  pending,
  onCancel,
  onConfirm,
}: {
  pending: PendingGumletUpload | null;
  onCancel: () => void;
  onConfirm: (target: 'gumlet_video' | 'gumlet_image', format: 'ABR' | 'MP4') => Promise<void>;
}) {
  const [target, setTarget] = useState<'gumlet_video' | 'gumlet_image'>('gumlet_video');
  const [format, setFormat] = useState<'ABR' | 'MP4'>('ABR');
  const [submitting, setSubmitting] = useState(false);

  const isFile = pending?.kind === 'file';
  const fileName = pending?.kind === 'file' ? pending.file.name : pending?.kind === 'link' ? pending.filename || pending.url : '';

  const handleConfirm = async () => {
    if (!pending || submitting) return;
    setSubmitting(true);
    try {
      await onConfirm(target, format);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isFile ? 'Choose upload settings' : 'Choose media type'}</DialogTitle>
        <DialogDescription className="truncate">{fileName}</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Upload to</p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={target === 'gumlet_video' ? 'default' : 'outline'}
              onClick={() => setTarget('gumlet_video')}
              disabled={isFile}
            >
              <FontAwesomeIcon icon={faFilm} className="mr-2" />Video
            </Button>
            <Button
              type="button"
              variant={target === 'gumlet_image' ? 'default' : 'outline'}
              onClick={() => setTarget('gumlet_image')}
              disabled={isFile}
            >
              <FontAwesomeIcon icon={faFileImage} className="mr-2" />Image
            </Button>
          </div>
          {isFile && (
            <p className="text-xs text-muted-foreground">File upload is available for video only.</p>
          )}
        </div>
        {target === 'gumlet_video' && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Output format</p>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as 'ABR' | 'MP4')} className="flex flex-col space-y-1">
              <div className="flex items-center space-x-3"><RadioGroupItem value="ABR" id="gc-abr" /><Label htmlFor="gc-abr" className="font-normal">HLS / DASH</Label></div>
              <div className="flex items-center space-x-3"><RadioGroupItem value="MP4" id="gc-mp4" /><Label htmlFor="gc-mp4" className="font-normal">MP4</Label></div>
            </RadioGroup>
          </div>
        )}
      </div>
      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="button" onClick={() => void handleConfirm()} disabled={submitting}>
          {submitting && <FontAwesomeIcon icon={faSpinner} className="mr-2 h-4 w-4 animate-spin" />}
          {submitting ? 'Uploading…' : 'Confirm'}
        </Button>
      </DialogFooter>
    </>
  );
}

// ---------------------------------------------------------------------------
// File card (mirrors Cloudinary's FileCard hover-overlay visual)
// ---------------------------------------------------------------------------

function FileCard({
  asset,
  formatOptions,
  canDelete,
  canEditHome,
  isHighlighted,
  isSelected,
  showCheckbox,
  onToggleSelect,
  onPreview,
  onCopy,
  onSetTag,
  onDelete,
  onSetBackground,
}: {
  asset: MediaLibraryAsset;
  formatOptions: string[];
  canDelete: boolean;
  canEditHome?: boolean;
  isHighlighted?: boolean;
  isSelected?: boolean;
  showCheckbox?: boolean;
  onToggleSelect?: (id: string) => void;
  onPreview: (asset: MediaLibraryAsset) => void;
  onCopy: (asset: MediaLibraryAsset, formatKey: string) => void;
  onSetTag: (asset: MediaLibraryAsset, tag: MediaMetaTag | null) => void;
  onDelete: (asset: MediaLibraryAsset) => void;
  onSetBackground?: (asset: MediaLibraryAsset) => void;
}) {
  const fileName = asset.filename || 'Untitled';

  return (
    <div className="flex flex-col gap-2">
      <div className={cn(
        'relative group aspect-square border rounded-lg overflow-hidden glass-effect p-1',
        isHighlighted && 'ring-2 ring-primary animate-shake',
        isSelected && 'ring-2 ring-primary'
      )}>
        {showCheckbox && (
          <div className={cn(
            'absolute top-2 left-2 z-30 w-[15%] min-w-5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto',
            isSelected && 'opacity-100 pointer-events-auto'
          )} onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect?.(asset.id)}
              className="h-auto aspect-square w-full rounded-full bg-background/80 [&>span]:absolute [&>span]:inset-0"
              iconClassName="h-[55%] w-[55%]"
            />
          </div>
        )}
        {asset.tag && (
          <span className={cn(
            'absolute top-2 z-20 h-4 w-4 rounded-full border-2 border-white shadow-md',
            showCheckbox ? 'left-[calc(15%+1.75rem)]' : 'left-2',
            TAG_COLORS[asset.tag]
          )} title={TAG_LABELS[asset.tag]} />
        )}
        <div className="relative w-full h-full rounded-md overflow-hidden">
          {asset.resourceType === 'image' ? (
            // Provider hosts are configurable, so static Next Image allowlisting is not safe here.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={asset.url} alt={fileName} className="w-full h-full object-cover" />
          ) : asset.resourceType === 'video' ? (
            <div className="w-full h-full bg-black flex items-center justify-center">
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <FontAwesomeIcon icon={faFilm} className="h-8 w-8 text-white/70" />
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <FontAwesomeIcon icon={faFileLines} className="h-8 w-8 text-white/70" />
            </div>
          )}
        </div>

        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 z-10">
          <div className="flex flex-wrap items-center justify-center gap-1 md:gap-2">
            <Button size="icon" variant="ghost" onClick={() => onPreview(asset)} title="Preview" className="h-8 w-8 md:h-10 md:w-10 text-white glass-effect">
              <FontAwesomeIcon icon={faEye} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="secondary" title="Tag" className="h-8 w-8 md:h-10 md:w-10 glass-effect">
                  <FontAwesomeIcon icon={faTag} className={asset.tag ? TAG_TEXT_COLORS[asset.tag] : ''} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                <DropdownMenuLabel>Tag</DropdownMenuLabel>
                {(Object.keys(TAG_LABELS) as MediaMetaTag[]).map((tag) => (
                  <DropdownMenuItem key={tag} onClick={() => onSetTag(asset, tag)}>
                    <span className={cn('h-3 w-3 rounded-full', TAG_COLORS[tag])} /> {TAG_LABELS[tag]}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onSetTag(asset, null)}>Remove tag</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="secondary" title="Copy url" className="h-8 w-8 md:h-10 md:w-10 glass-effect">
                  <FontAwesomeIcon icon={faCopy} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                <DropdownMenuLabel>Copy</DropdownMenuLabel>
                {formatOptions.map((fmt) => (
                  <DropdownMenuItem key={fmt} onClick={() => onCopy(asset, fmt)}>
                    {fmt === 'original' ? 'Original' : fmt.toUpperCase()}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {canEditHome && onSetBackground && (
              <Button size="icon" variant="secondary" onClick={() => onSetBackground(asset)} title="Set as background" className="h-8 w-8 md:h-10 md:w-10 glass-effect">
                <FontAwesomeIcon icon={faPhotoFilm} />
              </Button>
            )}
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="icon" variant="destructive" title="Delete" className="h-8 w-8 md:h-10 md:w-10">
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[80vw] glass-effect">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete "{fileName}"?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(asset)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>
      <div className="px-1 min-w-0">
        <p className="text-xs text-center text-muted-foreground truncate" title={fileName}>{fileName}</p>
      </div>
    </div>
  );
}