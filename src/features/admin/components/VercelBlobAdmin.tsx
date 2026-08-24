'use client';

import { useCallback, useState, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { upload } from '@vercel/blob/client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faCopy, faTrash, faFileLines, faFilm, faFileImage, faFolderOpen, faEye, faXmark } from '@fortawesome/free-solid-svg-icons';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';
import Preloader from '@/components/preloader';
import Image from 'next/image';

type VercelBlobDoc = {
  id: string;
  provider: 'vercel_blob';
  url: string;
  pathname: string;
  size: number;
  contentType: string;
  filename: string;
  uploadedAt?: any;
};

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function VercelBlobAdmin() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useAuth();

  const [activeTab, setActiveTab] = useState<'images' | 'videos' | 'files'>('images');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const [previewFile, setPreviewFile] = useState<VercelBlobDoc | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  const colRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'vercel_blobs'), orderBy('uploadedAt', 'desc'));
  }, [firestore]);

  const { data: blobs, isLoading } = useCollection<VercelBlobDoc>(colRef as any);

  const getToken = useCallback(async () => {
    const user = auth?.currentUser;
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch {
      return null;
    }
  }, [auth]);

  const handleUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const token = await getToken();
    if (!token) {
      toast({ variant: 'destructive', title: 'Not authenticated' });
      return;
    }
    for (const file of files) {
      if (file.type.startsWith('image/') && file.size > 50 * 1024 * 1024) {
        toast({ variant: 'destructive', title: 'Image exceeds 50MB limit', description: file.name });
        continue;
      }
      setIsUploading(true);
      setUploadProgress(30);
      setUploadingFileName(file.name);
      try {
        // Direct to Vercel Blob via handle-upload (bypasses server body limit — fixes Request Entity Too Large for videos)
        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/vercel-blob/handle-upload',
          headers: { Authorization: `Bearer ${token}` },
        } as any);
        setUploadProgress(100);
        // Firestore doc is created server-side in onUploadCompleted; no client mirror needed
        toast({ title: 'Uploaded to Vercel Blob', description: blob.url });
      } catch (e: any) {
        // Fallback: try legacy server put for small files if handle-upload fails
        const msg = e?.message || String(e);
        if (msg.includes('Unexpected token') || msg.includes('Request En')) {
          toast({ variant: 'destructive', title: 'Upload failed', description: 'Server rejected large payload. Try a smaller file or check BLOB_READ_WRITE_TOKEN.' });
        } else {
          toast({ variant: 'destructive', title: 'Upload failed', description: msg });
        }
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadingFileName('');
      }
    }
  }, [getToken, toast]);

  const onDrop = useCallback((accepted: File[]) => handleUpload(accepted), [handleUpload]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: true });

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: t('mediaAdmin.toast.copied.title') || 'Copied', description: url });
  };

  const handleDelete = async (url: string) => {
    const token = await getToken();
    if (!token) {
      toast({ variant: 'destructive', title: 'Not authenticated' });
      return;
    }
    try {
      const res = await fetch('/api/vercel-blob/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Delete failed');
      toast({ title: 'Deleted' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Delete failed', description: e?.message });
    }
  };

  const filteredByType = useMemo(() => {
    const all = blobs || [];
    const q = searchQuery.toLowerCase();
    const matchesSearch = (b: VercelBlobDoc) => !q || b.filename?.toLowerCase().includes(q) || b.url.toLowerCase().includes(q);
    const images = all.filter((b) => b.contentType?.startsWith('image/') && matchesSearch(b));
    const videos = all.filter((b) => b.contentType?.startsWith('video/') && matchesSearch(b));
    const files = all.filter((b) => !b.contentType?.startsWith('image/') && !b.contentType?.startsWith('video/') && matchesSearch(b));
    return { images, videos, files };
  }, [blobs, searchQuery]);

  const renderLibrary = (assets: VercelBlobDoc[], type: 'image' | 'video' | 'raw') => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-full min-h-[200px]">
          <Preloader />
        </div>
      );
    }
    if (!assets || assets.length === 0) {
      const typeName = type === 'raw' ? 'files' : `${type}s`;
      return (
        <div className="text-center py-12 text-muted-foreground">
          <FontAwesomeIcon icon={type === 'image' ? faFileImage : type === 'video' ? faFilm : faFileLines} className="h-12 w-12 mb-4" />
          <p>{t('mediaAdmin.empty').replace('{type}', typeName)}</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {assets.map((b) => {
          const isImage = b.contentType?.startsWith('image/');
          const isVideo = b.contentType?.startsWith('video/');
          return (
            <div key={b.id} className="flex flex-col gap-2">
              <div className="relative group aspect-square border rounded-lg overflow-hidden glass-effect p-1">
                <div className="relative w-full h-full rounded-md overflow-hidden bg-black/50 flex items-center justify-center">
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.url} alt={b.filename} className="w-full h-full object-cover" />
                  ) : isVideo ? (
                    <div className="w-full h-full bg-black flex items-center justify-center">
                      <FontAwesomeIcon icon={faFilm} className="h-8 w-8 text-white/70" />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <FontAwesomeIcon icon={faFileLines} className="h-8 w-8 text-white/70" />
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-wrap items-center justify-center gap-1 md:gap-2 p-2">
                  <Button size="icon" variant="ghost" onClick={() => setPreviewFile(b)} title="Preview" className="h-8 w-8 md:h-10 md:w-10 text-white glass-effect">
                    <FontAwesomeIcon icon={faEye} />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleCopy(b.url)} title="Copy URL" className="h-8 w-8 md:h-10 md:w-10 text-white glass-effect">
                    <FontAwesomeIcon icon={faCopy} />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="destructive" title="Delete" className="h-8 w-8 md:h-10 md:w-10">
                        <FontAwesomeIcon icon={faTrash} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete file?</AlertDialogTitle>
                        <AlertDialogDescription>Delete {b.filename} from Vercel Blob? This cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(b.url)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <div className="px-1 space-y-1 min-w-0">
                <p className="text-xs font-medium truncate" title={b.filename}>{b.filename}</p>
                <p className="text-xs text-muted-foreground truncate">{formatBytes(b.size)} • {b.contentType?.split('/')[1] || 'file'}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const uploadStrip = (
    <div className="flex flex-col gap-4">
      <div
        {...getRootProps()}
        className={cn(
          'flex-1 border-2 border-dashed rounded-lg p-6 text-center transition-colors relative cursor-pointer',
          isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50',
          isUploading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} disabled={isUploading} />
        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <FontAwesomeIcon icon={faCloudUploadAlt} className="h-8 w-8" />
          {isUploading ? (
            <p className="text-sm">{t('mediaAdmin.uploading')}</p>
          ) : (
            <p className="text-sm">{t('mediaAdmin.dragAndDrop')}</p>
          )}
        </div>
      </div>
      {isUploading && (
        <div>
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-sm text-center mt-2 text-muted-foreground">
            {t('mediaAdmin.uploadProgress').replace('{name}', uploadingFileName).replace('{progress}', String(Math.round(uploadProgress)))}
          </p>
        </div>
      )}
    </div>
  );

  const libraryDialog = (
    <Dialog open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
      <DialogContent className="w-[90vw] max-w-6xl h-[85vh] glass-effect p-0 flex flex-col">
        <DialogHeader className="p-4 border-b text-center">
          <DialogTitle className="font-headline">Vercel Blob Library</DialogTitle>
          <p className="text-sm text-muted-foreground">Isolated from Cloudinary — copy-paste URLs only</p>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col min-h-0">
          <div className="px-4 pt-4 flex items-center gap-2 flex-wrap">
            <TabsList>
              <TabsTrigger value="images" className="py-2 px-4 text-base glass-effect data-[state=active]:bg-destructive">
                <FontAwesomeIcon icon={faFileImage} className="mr-2" />
                {t('mediaAdmin.tab.images')}
              </TabsTrigger>
              <TabsTrigger value="videos" className="py-2 px-4 text-base glass-effect data-[state=active]:bg-destructive">
                <FontAwesomeIcon icon={faFilm} className="mr-2" />
                {t('mediaAdmin.tab.videos')}
              </TabsTrigger>
              <TabsTrigger value="files" className="py-2 px-4 text-base glass-effect data-[state=active]:bg-destructive">
                <FontAwesomeIcon icon={faFileLines} className="mr-2" />
                {t('mediaAdmin.tab.files')}
              </TabsTrigger>
            </TabsList>
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('mediaAdmin.searchPlaceholder')} className="max-w-[220px] md:max-w-xs ml-auto glass-effect" />
          </div>
          <div className="px-4 pt-3">
            <div
              {...getRootProps()}
              className={cn(
                'flex-1 border border-dashed rounded-md px-3 py-2 flex items-center justify-center gap-2 cursor-pointer transition-colors text-muted-foreground min-w-0',
                isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50',
                isUploading && 'opacity-50 cursor-not-allowed'
              )}
            >
              <input {...getInputProps()} disabled={isUploading} />
              <FontAwesomeIcon icon={faCloudUploadAlt} className="h-4 w-4 shrink-0" />
              <span className="text-xs md:text-sm truncate text-center">
                {isUploading ? t('mediaAdmin.uploading') : t('mediaAdmin.dragAndDrop')}
              </span>
            </div>
            {isUploading && (
              <div className="mt-2 flex items-center gap-2 min-w-0">
                <Progress value={uploadProgress} className="flex-1" />
                <span className="text-xs text-muted-foreground truncate max-w-[45%]">
                  {t('mediaAdmin.uploadProgress').replace('{name}', uploadingFileName).replace('{progress}', String(Math.round(uploadProgress)))}
                </span>
              </div>
            )}
          </div>
          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="images" className="p-4 m-0">{renderLibrary(filteredByType.images, 'image')}</TabsContent>
            <TabsContent value="videos" className="p-4 m-0">{renderLibrary(filteredByType.videos, 'video')}</TabsContent>
            <TabsContent value="files" className="p-4 m-0">{renderLibrary(filteredByType.files, 'raw')}</TabsContent>
          </ScrollArea>
        </Tabs>
        <DialogClose className={cn(
          "absolute right-4 top-4 h-8 w-8",
          "flex items-center justify-center rounded-full transition-opacity",
          "bg-destructive text-destructive-foreground opacity-70 hover:opacity-100",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:pointer-events-none"
        )}>
          <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
        </DialogClose>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-start justify-between">
        <div className="text-left">
          <h2 className="text-xl font-headline">Vercel Blob Library</h2>
          <p className="text-muted-foreground mt-1 text-sm">Isolated from Cloudinary — copy-paste URLs only. Images max 50MB, videos/other unlimited.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsLibraryOpen(true)} variant="outline" size="sm">
            <FontAwesomeIcon icon={faFolderOpen} className="mr-2" />
            Browse Library
          </Button>
        </div>
      </div>
      <Separator className="bg-white/10" />
      <div className="border rounded-lg p-6 glass-effect flex flex-col gap-4">
        {uploadStrip}
      </div>

      {libraryDialog}

      <Dialog open={!!previewFile} onOpenChange={(o) => !o && setPreviewFile(null)}>
        <DialogContent className="w-[80vw] h-[90vh] glass-effect p-0 flex flex-col items-center justify-center bg-black/80 border-0">
          <DialogHeader className="absolute top-4 left-4 z-10">
            <DialogTitle className="text-white/80 font-headline">{previewFile?.filename}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 w-full bg-black/50 flex items-center justify-center p-4">
            {previewFile?.contentType?.startsWith('image/') ? (
              <div className="relative w-full h-full">
                <Image src={previewFile.url} alt={previewFile.filename} fill className="object-contain" />
              </div>
            ) : previewFile?.contentType?.startsWith('video/') ? (
              <video src={previewFile.url} controls className="max-w-full max-h-full rounded-md" />
            ) : (
              <div className="text-center text-white/70">
                <FontAwesomeIcon icon={faFileLines} className="h-12 w-12 mb-2" />
                <p className="text-sm">{previewFile?.filename}</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => previewFile && handleCopy(previewFile.url)}>Copy URL</Button>
              </div>
            )}
          </div>
          <DialogClose className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:opacity-100 transition-opacity">
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
}
