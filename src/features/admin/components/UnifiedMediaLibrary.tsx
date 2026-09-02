'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useUser } from '@/firebase';
import type { AppUser } from '@/firebase/auth/use-user';
import { isSuperAdmin } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
import { useToast } from '@/hooks/use-toast';
import { useProviderMedia } from '@/features/admin/hooks/use-provider-media';
import type { MediaLibraryAsset } from '@/features/admin/lib/media-asset';
import type { MediaMetaTag } from '@/lib/media-meta';
import type { MediaProvider } from '@/lib/media-providers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowDown,
  faCloudUploadAlt,
  faCopy,
  faEye,
  faFileImage,
  faFileLines,
  faFilm,
  faFolderOpen,
  faLink,
  faMinus,
  faSearch,
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

  // ---- Dropzone (drag & drop) ----
  const onDrop = useCallback(
    async (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;
      if (isGumlet) {
        setPendingUpload({ kind: 'file', file });
        setGumletChoiceOpen(true);
        return;
      }
      await performFileUpload(file, 'appwrite');
    },
    [isGumlet, performFileUpload]
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
      await performFileUpload(file, 'appwrite');
    },
    [isGumlet, performFileUpload]
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

  const remove = useCallback(
    async (asset: MediaLibraryAsset) => {
      if (!window.confirm(`Delete "${asset.filename}"? This cannot be undone.`)) return;
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

  const grid = useCallback(
    (tab: AssetTab) => {
      const q = search.trim().toLowerCase();
      const items = media.assets.filter((a) => {
        const tabOk = tabOfType(a.resourceType) === tab;
        return tabOk && (!q || a.filename?.toLowerCase().includes(q) || a.url.toLowerCase().includes(q));
      });
      if (media.isLoading) {
        return <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>;
      }
      if (items.length === 0) {
        return <p className="py-10 text-center text-sm text-muted-foreground">No {tab} found.</p>;
      }
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((asset) => (
            <article key={asset.id} className="space-y-2 rounded-lg border p-2">
              <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded bg-muted">
                {asset.resourceType === 'image' ? (
                  // Provider hosts are configurable, so static Next Image allowlisting is not safe here.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.url} alt={asset.filename} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-black/60">
                    <FontAwesomeIcon icon={iconFor(asset.resourceType)} className="h-10 w-10 text-white/70" />
                  </div>
                )}
                {asset.tag && <span className={cn('absolute right-2 top-2 h-4 w-4 rounded-full border-2 border-white shadow-md', TAG_COLORS[asset.tag])} title={TAG_LABELS[asset.tag]} />}
              </div>
              <p className="truncate text-xs" title={asset.filename}>{asset.filename || 'Untitled'}</p>
              <div className="flex gap-1">
                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setPreview(asset)} title="Preview"><FontAwesomeIcon icon={faEye} /></Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="outline" className="h-8 w-8" title="Copy link"><FontAwesomeIcon icon={faCopy} /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Copy</DropdownMenuLabel>
                    {formatOptions.map((fmt) => (
                      <DropdownMenuItem key={fmt} onClick={() => void copy(asset, fmt)}>
                        <FontAwesomeIcon icon={faArrowDown} className="mr-2" />{fmt === 'original' ? 'Original' : fmt.toUpperCase()}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="outline" className="h-8 w-8" title="Tag"><FontAwesomeIcon icon={faTag} /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Tag</DropdownMenuLabel>
                    {(Object.keys(TAG_LABELS) as MediaMetaTag[]).map((tag) => (
                      <DropdownMenuItem key={tag} onClick={() => void setTag(asset, tag)}>
                        <span className={cn('mr-2 h-3 w-3 rounded-full', TAG_COLORS[tag])} />{TAG_LABELS[tag]}
                      </DropdownMenuItem>
                    ))}
                    {asset.tag && <><DropdownMenuSeparator /><DropdownMenuItem onClick={() => void setTag(asset, null)}>Remove tag</DropdownMenuItem></>}
                  </DropdownMenuContent>
                </DropdownMenu>
                {canDelete && (
                  <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => void remove(asset)} title="Delete"><FontAwesomeIcon icon={faTrash} /></Button>
                )}
              </div>
            </article>
          ))}
        </div>
      );
    },
    [media.assets, media.isLoading, search, canDelete, formatOptions, copy, setTag, remove]
  );

  const iconFor = (type: string) => (type === 'image' ? faFileImage : type === 'video' ? faFilm : faFileLines);

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
        <DialogContent className="glass-effect p-0 flex flex-col w-[90vw] max-w-6xl h-[85vh]">
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
              <div className="relative ml-auto">
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="pl-9 w-56" />
              </div>
            </div>
            {uploadStrip}
            <ScrollArea className="flex-1">
              <TabsContent value="images" className="p-4 m-0">{grid('images')}</TabsContent>
              <TabsContent value="videos" className="p-4 m-0">{grid('videos')}</TabsContent>
              <TabsContent value="files" className="p-4 m-0">{grid('files')}</TabsContent>
            </ScrollArea>
          </Tabs>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="absolute right-4 top-4">
              <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
            </Button>
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
        <DialogContent className="w-[80vw] max-w-3xl glass-effect">
          {preview && (
            <div className="space-y-3">
              {preview.resourceType === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.url} alt={preview.filename} className="max-h-[60vh] w-full rounded object-contain" />
              ) : preview.url ? (
                <video src={preview.url} controls className="aspect-video w-full rounded bg-black" />
              ) : <p className="py-10 text-center text-sm text-muted-foreground">No playback URL available.</p>}
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium">{preview.filename}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => void copy(preview, 'original')}><FontAwesomeIcon icon={faCopy} className="mr-2" />Copy URL</Button>
                  {canDelete && <Button size="sm" variant="destructive" onClick={() => void remove(preview)}><FontAwesomeIcon icon={faTrash} className="mr-2" />Delete</Button>}
                </div>
              </div>
            </div>
          )}
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