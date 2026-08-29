'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileImage, faFilm, faFileLines, faXmark, faCloudUploadAlt, faLink } from '@fortawesome/free-solid-svg-icons';
import { useCollection, useFirestore, useMemoFirebase, useUser, useAuth } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import Preloader from '@/components/preloader';
import { useMediaProvider } from '@/hooks/use-media-provider';
import { useUploadProgress } from '@/components/upload-progress-context';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';
import { useMediaUpload } from '@/features/admin/hooks/use-media-upload';
import { isSuperAdmin as isSuperAdminCheck } from '@/lib/constants';
import { Progress } from '@/components/ui/progress';
import AddFromUrlDialog from './AddFromUrlDialog';

// Cloudinary URL helpers
const CLOUDINARY_UPLOAD_RE = /\/(image|video|raw)\/upload\//;
const withTransform = (url: string, transform: string): string =>
  url.replace(CLOUDINARY_UPLOAD_RE, (m) => `${m}${transform}/`);
const stripTransforms = (url: string): string =>
  url.replace(/^(.*?\/upload\/)(?:[^/]+)?(\/v\d+\/)/, '$1$2');
const formatVariant = (url: string, fmt: 'mp4' | 'webm' | 'webp' | 'avif' | 'jpg' | 'png'): string => {
  const out = withTransform(stripTransforms(url), `f_${fmt},q_auto,fl_attachment`);
  return out.replace(/\.(m3u8|webm|mp4|mov|jpeg|jpg|png|gif|webp|avif)$/i, `.${fmt}`);
};
const hlsVariant = (url: string): string => {
  const stripped = stripTransforms(url).replace(/\.[a-z0-9]+$/i, '.m3u8');
  return withTransform(stripped, 'sp_auto');
};

type MediaAsset = {
  id: string;
  url: string;
  public_id: string;
  resource_type: 'image' | 'video' | 'raw';
  filename: string;
  libraryId?: 'primary' | 'extented';
  title?: string;
};

type VercelBlobDoc = {
  id: string;
  url: string;
  pathname: string;
  size: number;
  contentType: string;
  filename: string;
  uploadedAt?: any;
};

interface UnifiedMediaPickerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onMediaSelect: (url: string, type: 'image' | 'video' | 'raw', filename: string) => void;
  forceProvider?: 'cloudinary' | 'vercel';
}

export default function UnifiedMediaPicker({ isOpen, onOpenChange, onMediaSelect, forceProvider }: UnifiedMediaPickerProps) {
  const { t } = useTranslation();
  const firestore = useFirestore();
  const [preferredProvider] = useMediaProvider();

  const [provider, setProvider] = useState<'cloudinary' | 'vercel'>(
    forceProvider || (preferredProvider === 'vercel_blob' ? 'vercel' : 'cloudinary')
  );
  const [activeTab, setActiveTab] = useState<'images' | 'videos' | 'files'>('images');
  const [activeLibrary, setActiveLibrary] = useState<'primary' | 'extented'>('primary');
  const [searchQuery, setSearchQuery] = useState('');
  const [formatChoiceAsset, setFormatChoiceAsset] = useState<{ url: string; resourceType: 'image' | 'video' | 'raw'; filename: string } | null>(null);
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
  const [newlyUploadedId, setNewlyUploadedId] = useState<string | null>(null);

  const { completedUpload, consumeCompletedUpload } = useUploadProgress();

  // Highlight files uploaded from inside this picker, then clear the marker so
  // we don't re-highlight on subsequent mounts or re-renders.
  useEffect(() => {
    if (!completedUpload) return;
    if (completedUpload.source !== 'media-picker') return;
    setNewlyUploadedId(completedUpload.docId);
    window.dispatchEvent(new CustomEvent('media-upload-highlighted', {
      detail: { provider: completedUpload.provider, docId: completedUpload.docId },
    }));
    consumeCompletedUpload();
    const t = setTimeout(() => setNewlyUploadedId(null), 3000);
    return () => clearTimeout(t);
  }, [completedUpload, consumeCompletedUpload]);

  // While this picker is open, tell the global upload notification not to
  // surface a redundant "Uploaded to ..." toast — the new file will be
  // highlighted directly in this picker's grid.
  useEffect(() => {
    if (!isOpen) return;
    const providerEvt = provider as 'cloudinary' | 'vercel';
    console.log('[Picker] dispatching media-surface-opened', { provider: providerEvt, isOpen });
    window.dispatchEvent(new CustomEvent('media-surface-opened', {
      detail: { provider: providerEvt },
    }));
    return () => {
      console.log('[Picker] dispatching media-surface-closed', { provider: providerEvt });
      window.dispatchEvent(new CustomEvent('media-surface-closed', {
        detail: { provider: providerEvt },
      }));
    };
  }, [isOpen, provider]);

  // ---- Inline upload affordance ----
  // Lets the user drop a file (or paste a URL) without leaving the picker.
  // Mirrors the permission model from MediaLibrary: superadmin OR a user
  // doc with canUploadMedia.
  const { user } = useUser();
  const auth = useAuth();
  const typedUser = user as { email?: string | null; permissions?: { canUploadMedia?: boolean } } | null;
  const isSuperAdmin = isSuperAdminCheck(typedUser);
  const canUpload = isSuperAdmin || (typedUser?.permissions?.canUploadMedia ?? true);
  const { toast } = useToast();
  const { upload: doUpload, isUploading, progress: uploadProgress, error: uploadError, reset: resetUpload } = useMediaUpload({
    provider: provider as 'cloudinary' | 'vercel',
    libraryId: provider === 'cloudinary' ? activeLibrary : undefined,
    enabled: canUpload,
    source: 'media-picker',
  });

  const handleUploadedFile = useCallback(
    (result: { url: string; resourceType: 'image' | 'video' | 'raw'; filename: string }) => {
      // For Cloudinary images, route through the format-choice dialog so the
      // user picks a delivery format. For everything else, select directly.
      if (provider === 'cloudinary' && (result.resourceType === 'image' || result.resourceType === 'video')) {
        setFormatChoiceAsset({ url: result.url, resourceType: result.resourceType, filename: result.filename });
      } else {
        handleSelect(result.url, result.resourceType, result.filename);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider]
  );

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (!canUpload) {
        toast({ variant: 'destructive', title: t('mediaAdmin.toast.permissionDenied.title') || 'Permission denied', description: t('mediaAdmin.toast.permissionDenied.description') || 'You do not have permission to upload media.' });
        return;
      }
      if (accepted.length === 0) return;
      const file = accepted[0]; // Single-file upload in the picker
      resetUpload();
      doUpload(file).then(handleUploadedFile).catch((e) => {
        if (e?.name === 'AbortError') return; // user cancelled
        toast({ variant: 'destructive', title: t('mediaAdmin.toast.uploadFailed.title') || 'Upload failed', description: e?.message || String(e) });
      });
    },
    [canUpload, doUpload, handleUploadedFile, resetUpload, toast, t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    disabled: !canUpload || isUploading,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.svg', '.bmp'],
      'video/*': ['.mp4', '.mov', '.webm', '.m3u8'],
    },
  });

  const handleUploadFromUrl = useCallback(
    async (url: string) => {
      setIsUrlDialogOpen(false);
      // Vercel path: use the dedicated /api/vercel-blob/add-from-url route
      // (already secured with SSRF guard + size cap + rate limit).
      // Cloudinary path: handled by AddFromUrlDialog (opened via the
      // "From URL" button below — that dialog has its own submit handler).
      if (provider !== 'vercel') return;
      try {
        const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
        if (!token) throw new Error('Not signed in.');
        const res = await fetch('/api/vercel-blob/add-from-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Add from URL failed');
        const ct = (data.contentType || '').toLowerCase();
        handleUploadedFile({
          url: data.url,
          resourceType: ct.startsWith('image/') ? 'image' : ct.startsWith('video/') ? 'video' : 'raw',
          filename: (data.pathname || '').split('/').pop() || 'file',
        });
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'Add from URL failed', description: e?.message || String(e) });
      }
    },
    [provider, auth, handleUploadedFile, toast]
  );

  const mediaCollectionRef = useMemoFirebase(() => firestore ? query(collection(firestore, 'media'), orderBy('created_at', 'desc')) : null, [firestore]);
  const { data: mediaAssets, isLoading: isLoadingMedia } = useCollection<MediaAsset>(mediaCollectionRef);

  const vercelColRef = useMemoFirebase(() => firestore ? query(collection(firestore, 'vercel_blobs'), orderBy('uploadedAt', 'desc')) : null, [firestore]);
  const { data: vercelBlobs, isLoading: isLoadingVercel } = useCollection<VercelBlobDoc>(vercelColRef as any);

  const handleSelect = (url: string, type: 'image' | 'video' | 'raw', filename: string) => {
    setFormatChoiceAsset(null);
    onMediaSelect(url, type, filename);
    onOpenChange(false);
  };

  // Cloudinary items route through a format-choice dialog (image/video formats);
  // Vercel items select directly since their original format is delivered.
  const handleItemClick = (item: { url: string; resourceType: 'image' | 'video' | 'raw'; filename: string }, itemProvider: 'cloudinary' | 'vercel') => {
    if (itemProvider === 'cloudinary') {
      setFormatChoiceAsset(item);
    } else {
      handleSelect(item.url, item.resourceType, item.filename);
    }
  };

  const renderCloudinaryGrid = (type: 'image' | 'video' | 'raw') => {
    if (isLoadingMedia) return <div className="flex justify-center py-12"><Preloader /></div>;
    const q = searchQuery.trim().toLowerCase();
    const filtered = (mediaAssets || []).filter(a => {
      const libraryMatch = a.libraryId === activeLibrary || (activeLibrary === 'primary' && !a.libraryId);
      const typeMatch = type === 'image' ? a.resource_type === 'image' : type === 'video' ? a.resource_type === 'video' : a.resource_type === 'raw';
      const searchMatch = !q || a.filename?.toLowerCase().includes(q) || a.title?.toLowerCase().includes(q);
      return libraryMatch && typeMatch && searchMatch;
    });
    if (filtered.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <FontAwesomeIcon icon={type === 'image' ? faFileImage : type === 'video' ? faFilm : faFileLines} className="h-12 w-12 mb-4" />
          <p>{t('mediaAdmin.empty').replace('{type}', type === 'raw' ? 'files' : `${type}s`)}</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filtered.map(file => (
          <div key={file.id} className={cn("flex flex-col gap-2 group cursor-pointer", file.id === newlyUploadedId && "animate-pulse ring-2 ring-primary rounded-lg")} onClick={() => handleItemClick({ url: file.url, resourceType: file.resource_type, filename: file.filename }, 'cloudinary')}>
            <div className={cn("relative aspect-square border rounded-lg overflow-hidden glass-effect p-1 group-hover:ring-2 group-hover:ring-primary transition-all", file.id === newlyUploadedId && "ring-2 ring-primary")}>
              <div className="relative w-full h-full rounded-md overflow-hidden">
                {file.resource_type === 'image' ? (
                  <Image src={file.url} alt={file.filename} fill className="object-cover" />
                ) : file.resource_type === 'video' ? (
                  <div className="w-full h-full bg-black flex items-center justify-center">
                    <Image src={file.url.replace(/\.(webm|m3u8)$/, '.jpg').replace(/\.mp4$/, '.jpg')} alt={file.filename} fill className="object-cover" />
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
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white font-bold text-sm">{t('mediaAdmin.select') || 'Select'}</span>
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground truncate" title={file.filename}>{file.filename || file.public_id}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderVercelGrid = (type: 'image' | 'video' | 'raw') => {
    if (isLoadingVercel) return <div className="flex justify-center py-12"><Preloader /></div>;
    const q = searchQuery.toLowerCase();
    const all = vercelBlobs || [];
    const matches = (b: VercelBlobDoc) => !q || b.filename?.toLowerCase().includes(q) || b.url.toLowerCase().includes(q);
    const filtered = all.filter(b => {
      const isImage = b.contentType?.startsWith('image/');
      const isVideo = b.contentType?.startsWith('video/');
      const typeMatch = type === 'image' ? isImage : type === 'video' ? isVideo : (!isImage && !isVideo);
      return typeMatch && matches(b);
    });
    if (filtered.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <FontAwesomeIcon icon={type === 'image' ? faFileImage : type === 'video' ? faFilm : faFileLines} className="h-12 w-12 mb-4" />
          <p>{t('mediaAdmin.empty').replace('{type}', type === 'raw' ? 'files' : `${type}s`)}</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filtered.map(b => {
          const isImage = b.contentType?.startsWith('image/');
          const mappedType: 'image' | 'video' | 'raw' = isImage ? 'image' : b.contentType?.startsWith('video/') ? 'video' : 'raw';
          return (
            <div key={b.id} className={cn("flex flex-col gap-2 group cursor-pointer", b.id === newlyUploadedId && "animate-pulse ring-2 ring-primary rounded-lg")} onClick={() => handleItemClick({ url: b.url, resourceType: mappedType, filename: b.filename }, 'vercel')}>
              <div className={cn("relative aspect-square border rounded-lg overflow-hidden glass-effect p-1 group-hover:ring-2 group-hover:ring-primary transition-all", b.id === newlyUploadedId && "ring-2 ring-primary")}>
                <div className="relative w-full h-full rounded-md overflow-hidden bg-black/50 flex items-center justify-center">
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.url} alt={b.filename} className="w-full h-full object-cover" />
                  ) : b.contentType?.startsWith('video/') ? (
                    <div className="w-full h-full bg-black flex items-center justify-center">
                      <FontAwesomeIcon icon={faFilm} className="h-8 w-8 text-white/70" />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <FontAwesomeIcon icon={faFileLines} className="h-8 w-8 text-white/70" />
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{t('mediaAdmin.select') || 'Select'}</span>
                </div>
              </div>
              <div className="px-1 space-y-1 min-w-0">
                <p className="text-xs font-medium truncate" title={b.filename}>{b.filename}</p>
                <p className="text-xs text-muted-foreground truncate">{b.contentType?.split('/')[1] || 'file'}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-6xl h-[85vh] glass-effect p-0 flex flex-col">
        <DialogHeader className="p-4 border-b text-center">
          <DialogTitle className="font-headline">{t('mediaAdmin.chooseMedia') || 'Choose Media'}</DialogTitle>
          <p className="text-sm text-muted-foreground">Select from Cloudinary or Vercel Blob libraries</p>
        </DialogHeader>

        {!forceProvider && (
          <Tabs value={provider} onValueChange={v => setProvider(v as any)} className="px-4 pt-3">
            <TabsList>
              <TabsTrigger value="cloudinary" className="glass-effect data-[state=active]:bg-destructive">Cloudinary</TabsTrigger>
              <TabsTrigger value="vercel" className="glass-effect data-[state=active]:bg-destructive">Vercel Blob</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {provider === 'cloudinary' && (
          <Tabs value={activeLibrary} onValueChange={v => setActiveLibrary(v as any)} className="px-4 pt-2">
            <TabsList>
              <TabsTrigger value="primary" className="py-1 px-3 text-sm glass-effect data-[state=active]:bg-destructive">{t('mediaAdmin.tab.libraryPrimary')}</TabsTrigger>
              <TabsTrigger value="extented" className="py-1 px-3 text-sm glass-effect data-[state=active]:bg-destructive">{t('mediaAdmin.tab.libraryExtented')}</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)} className="flex-1 flex flex-col min-h-0">
          <div className="px-4 pt-3 flex items-center gap-2 flex-wrap">
            <TabsList>
              <TabsTrigger value="images" className="py-2 px-4 text-sm glass-effect data-[state=active]:bg-destructive">
                <FontAwesomeIcon icon={faFileImage} className="mr-2" />{t('mediaAdmin.tab.images')}
              </TabsTrigger>
              <TabsTrigger value="videos" className="py-2 px-4 text-sm glass-effect data-[state=active]:bg-destructive">
                <FontAwesomeIcon icon={faFilm} className="mr-2" />{t('mediaAdmin.tab.videos')}
              </TabsTrigger>
              <TabsTrigger value="files" className="py-2 px-4 text-sm glass-effect data-[state=active]:bg-destructive">
                <FontAwesomeIcon icon={faFileLines} className="mr-2" />{t('mediaAdmin.tab.files')}
              </TabsTrigger>
            </TabsList>
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t('mediaAdmin.searchPlaceholder')} className="max-w-[200px] ml-auto glass-effect" />
          </div>

          {canUpload && (
            <div className="px-4 pt-2 flex items-center gap-2 flex-wrap">
              <div
                {...getRootProps()}
                className={cn(
                  'flex-1 min-w-[200px] flex items-center justify-center gap-2 rounded-md border-2 border-dashed px-3 py-2 text-sm cursor-pointer transition-colors',
                  isDragActive ? 'border-primary bg-primary/10 text-primary' : 'border-white/15 text-muted-foreground hover:border-white/30 hover:text-foreground',
                  isUploading && 'opacity-50 cursor-not-allowed'
                )}
              >
                <input {...getInputProps()} />
                <FontAwesomeIcon icon={faCloudUploadAlt} className="h-4 w-4" />
                <span>
                  {isUploading
                    ? `Uploading… ${uploadProgress}%`
                    : isDragActive
                      ? 'Drop to upload'
                      : 'Drop a file here, or click to browse'}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsUrlDialogOpen(true)}
                disabled={isUploading}
                className="glass-effect shrink-0"
              >
                <FontAwesomeIcon icon={faLink} className="mr-2 h-3 w-3" />
                From URL
              </Button>
            </div>
          )}

          {isUploading && (
            <div className="px-4 pt-2">
              <Progress value={uploadProgress} className="h-1" />
            </div>
          )}

          {uploadError && !isUploading && (
            <div className="px-4 pt-2 text-xs text-destructive">
              {uploadError.message}
              <button onClick={resetUpload} className="ml-2 underline">dismiss</button>
            </div>
          )}
          <ScrollArea className="flex-1 mt-3">
            {provider === 'cloudinary' ? (
              <>
                <TabsContent value="images" className="p-4 m-0">{renderCloudinaryGrid('image')}</TabsContent>
                <TabsContent value="videos" className="p-4 m-0">{renderCloudinaryGrid('video')}</TabsContent>
                <TabsContent value="files" className="p-4 m-0">{renderCloudinaryGrid('raw')}</TabsContent>
              </>
            ) : (
              <>
                <TabsContent value="images" className="p-4 m-0">{renderVercelGrid('image')}</TabsContent>
                <TabsContent value="videos" className="p-4 m-0">{renderVercelGrid('video')}</TabsContent>
                <TabsContent value="files" className="p-4 m-0">{renderVercelGrid('raw')}</TabsContent>
              </>
            )}
          </ScrollArea>
        </Tabs>

        <DialogClose className={cn("absolute right-4 top-4 h-8 w-8 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-70 hover:opacity-100")}>
          <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
        </DialogClose>
      </DialogContent>
    </Dialog>

    {/* Format choice dialog (Cloudinary only) */}
    <Dialog open={!!formatChoiceAsset} onOpenChange={(open) => { if (!open) setFormatChoiceAsset(null); }}>
      <DialogContent className="w-[80vw] glass-effect">
        <DialogHeader>
          <DialogTitle>{t('mediaAdmin.chooseFormat') || 'Choose Format'}</DialogTitle>
          <DialogDescription>{t('mediaAdmin.chooseFormatDescription') || 'Select the format you want to use for this media.'}</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3">
          {formatChoiceAsset?.resourceType === 'video' ? (
            <div className="flex flex-col gap-2">
              <Button onClick={() => { if (formatChoiceAsset) { handleSelect(formatVariant(formatChoiceAsset.url, 'mp4'), 'video', formatChoiceAsset.filename); } }} variant="outline" className="justify-start">
                <FontAwesomeIcon icon={faFilm} className="mr-2 h-4 w-4" /> MP4
              </Button>
              <Button onClick={() => { if (formatChoiceAsset) { handleSelect(formatVariant(formatChoiceAsset.url, 'webm'), 'video', formatChoiceAsset.filename); } }} variant="outline" className="justify-start">
                <FontAwesomeIcon icon={faFilm} className="mr-2 h-4 w-4" /> WebM
              </Button>
              <Button onClick={() => { if (formatChoiceAsset) { handleSelect(hlsVariant(formatChoiceAsset.url), 'video', formatChoiceAsset.filename); } }} variant="outline" className="justify-start">
                <FontAwesomeIcon icon={faFilm} className="mr-2 h-4 w-4" /> HLS (m3u8)
              </Button>
              <Button onClick={() => { if (formatChoiceAsset) { handleSelect(formatChoiceAsset.url, 'video', formatChoiceAsset.filename); } }} variant="ghost" className="justify-start text-muted-foreground">
                {t('mediaAdmin.copy.default') || 'Original'}
              </Button>
            </div>
          ) : formatChoiceAsset?.resourceType === 'image' ? (
            <div className="flex flex-col gap-2">
              <Button onClick={() => { if (formatChoiceAsset) { handleSelect(formatVariant(formatChoiceAsset.url, 'webp'), 'image', formatChoiceAsset.filename); } }} variant="outline" className="justify-start">
                <FontAwesomeIcon icon={faFileImage} className="mr-2 h-4 w-4" /> WebP
              </Button>
              <Button onClick={() => { if (formatChoiceAsset) { handleSelect(formatVariant(formatChoiceAsset.url, 'avif'), 'image', formatChoiceAsset.filename); } }} variant="outline" className="justify-start">
                <FontAwesomeIcon icon={faFileImage} className="mr-2 h-4 w-4" /> AVIF
              </Button>
              <Button onClick={() => { if (formatChoiceAsset) { handleSelect(formatVariant(formatChoiceAsset.url, 'jpg'), 'image', formatChoiceAsset.filename); } }} variant="outline" className="justify-start">
                <FontAwesomeIcon icon={faFileImage} className="mr-2 h-4 w-4" /> JPG
              </Button>
              <Button onClick={() => { if (formatChoiceAsset) { handleSelect(formatVariant(formatChoiceAsset.url, 'png'), 'image', formatChoiceAsset.filename); } }} variant="outline" className="justify-start">
                <FontAwesomeIcon icon={faFileImage} className="mr-2 h-4 w-4" /> PNG
              </Button>
              <Button onClick={() => { if (formatChoiceAsset) { handleSelect(formatChoiceAsset.url, 'image', formatChoiceAsset.filename); } }} variant="ghost" className="justify-start text-muted-foreground">
                {t('mediaAdmin.copy.default') || 'Original'}
              </Button>
            </div>
          ) : (
            <Button onClick={() => { if (formatChoiceAsset) { handleSelect(formatChoiceAsset.url, formatChoiceAsset.resourceType, formatChoiceAsset.filename); } }} className="w-full">
              <FontAwesomeIcon icon={faFileImage} className="mr-2 h-4 w-4" /> {t('mediaAdmin.select') || 'Select'}
            </Button>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setFormatChoiceAsset(null)}>{t('adminMgmt.cancel') || 'Cancel'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Cloudinary URL upload — reuses the existing AddFromUrlDialog (which
        uses the Genkit flow + Cloudinary uploader and writes the Firestore
        mirror). The dialog is opened in the same picker's modal stack so
        closing it returns the user to the picker. */}
    {provider === 'cloudinary' && (
      <AddFromUrlDialog
        isOpen={isUrlDialogOpen}
        onOpenChange={setIsUrlDialogOpen}
        onUploadComplete={async (mediaId, resourceType, libraryId) => {
          setIsUrlDialogOpen(false);
          // AddFromUrlDialog just wrote the Firestore mirror; read it back
          // to get the url + filename, then auto-select the new asset.
          // (For a tighter integration we'd refactor AddFromUrlDialog to
          // return the asset, but this keeps the change small.)
          if (!firestore) return;
          const { doc, getDoc } = await import('firebase/firestore');
          const snap = await getDoc(doc(firestore, 'media', mediaId));
          if (snap.exists()) {
            const data = snap.data() as { url: string; public_id: string; filename?: string; title?: string };
            handleSelect(data.url, resourceType, data.filename || data.title || data.public_id);
          }
        }}
      />
    )}

    {/* Vercel URL upload — a small inline form, since the AddFromUrlDialog is
        Cloudinary-only. The actual work is done by /api/vercel-blob/add-from-url
        (which has SSRF guard + size cap + rate limit). */}
    {provider === 'vercel' && (
      <Dialog open={isUrlDialogOpen} onOpenChange={setIsUrlDialogOpen}>
        <DialogContent className="w-[80vw] max-w-lg glass-effect">
          <DialogHeader>
            <DialogTitle>{t('mediaAdmin.addFromUrl') || 'Add from URL'}</DialogTitle>
            <DialogDescription>
              {t('mediaAdmin.addFromUrlDescription') || 'Fetch a publicly accessible file and add it to your Vercel Blob library.'}
            </DialogDescription>
          </DialogHeader>
          <UrlUploadForm onSubmit={(url) => handleUploadFromUrl(url)} />
        </DialogContent>
      </Dialog>
    )}
    </>
  );
}

function UrlUploadForm({ onSubmit }: { onSubmit: (url: string) => void }) {
  const [url, setUrl] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (url.trim()) onSubmit(url.trim());
      }}
      className="space-y-3 pt-2"
    >
      <Input
        type="url"
        placeholder="https://example.com/image.jpg"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <Button type="submit">Fetch & Upload</Button>
      </div>
    </form>
  );
}
