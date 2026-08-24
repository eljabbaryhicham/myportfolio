'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faCopy, faTrash, faFileLines, faFilm, faFileImage } from '@fortawesome/free-solid-svg-icons';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';

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

  const colRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'vercel_blobs'), orderBy('uploadedAt', 'desc'));
  }, [firestore]);

  const { data: blobs, isLoading } = useCollection<VercelBlobDoc>(colRef as any);

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [filter, setFilter] = useState('');

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
      setProgress(10);
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await fetch('/api/vercel-blob/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Upload failed');
        }
        toast({ title: 'Uploaded to Vercel Blob', description: file.name });
        setProgress(100);
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'Upload failed', description: e?.message || String(e) });
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
    }
  }, [getToken, toast]);

  const onDrop = useCallback((accepted: File[]) => handleUpload(accepted), [handleUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

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

  const filtered = (blobs || []).filter((b) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return b.filename?.toLowerCase().includes(q) || b.url.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold">Vercel Blob Storage</h3>
        <p className="text-sm text-muted-foreground">
          Isolated from Cloudinary. Upload any file type. Images max 50MB, videos/other unlimited. URLs are copy-paste only (not mixed into Cloudinary picker).
        </p>
        {!process.env.NEXT_PUBLIC_BLOB_TOKEN && (
          <p className="text-xs text-amber-500">Set <code>BLOB_READ_WRITE_TOKEN</code> in env to enable uploads.</p>
        )}
      </div>

      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <FontAwesomeIcon icon={faCloudUploadAlt} className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm">
            {isDragActive ? 'Drop files here' : 'Drag & drop files here, or click to select'}
          </p>
          <p className="text-xs text-muted-foreground">All types allowed</p>
        </div>
      </div>

      {isUploading && <Progress value={progress} className="h-2" />}

      <div className="flex items-center gap-2">
        <Input placeholder="Search by filename..." value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-sm" />
        <span className="text-xs text-muted-foreground">{filtered.length} files</span>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No files yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((b) => {
            const isImage = b.contentType?.startsWith('image/');
            const isVideo = b.contentType?.startsWith('video/');
            return (
              <div key={b.id} className="flex flex-col gap-2 border rounded-lg p-2 glass-effect">
                <div className="relative aspect-square rounded-md overflow-hidden bg-black/50 flex items-center justify-center">
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.url} alt={b.filename} className="w-full h-full object-cover" />
                  ) : isVideo ? (
                    <div className="flex flex-col items-center gap-1 text-white/70">
                      <FontAwesomeIcon icon={faFilm} className="h-8 w-8" />
                      <span className="text-xs">Video</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-white/70">
                      <FontAwesomeIcon icon={faFileLines} className="h-8 w-8" />
                      <span className="text-xs truncate px-1">{b.filename?.split('.').pop() || 'file'}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1 min-w-0">
                  <p className="text-xs font-medium truncate" title={b.filename}>{b.filename}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(b.size)} • {b.contentType?.split('/')[1] || 'file'}</p>
                  <p className="text-xs truncate text-muted-foreground" title={b.url}>{b.url}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleCopy(b.url)} title="Copy URL">
                    <FontAwesomeIcon icon={faCopy} className="h-3 w-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="destructive" className="h-8 w-8" title="Delete">
                        <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
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
            );
          })}
        </div>
      )}
    </div>
  );
}
