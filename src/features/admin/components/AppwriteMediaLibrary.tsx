'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth, useUser } from '@/firebase';
import type { AppUser } from '@/firebase/auth/use-user';
import { isSuperAdmin } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import type { ProviderAssetRecord, MediaResourceType } from '@/lib/media-providers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faFileImage, faFileLines, faFilm, faRotate, faTrash, faUpload } from '@fortawesome/free-solid-svg-icons';

type AppwriteAsset = ProviderAssetRecord & { provider: 'appwrite' };
type AssetTab = 'images' | 'videos' | 'files';

function tabFor(type: MediaResourceType): AssetTab {
  return type === 'image' ? 'images' : type === 'video' ? 'videos' : 'files';
}

export default function AppwriteMediaLibrary() {
  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<AppwriteAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<AssetTab>('images');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const typedUser = user as AppUser | null;
  const canUpload = isSuperAdmin(typedUser) || (typedUser?.permissions?.canUploadMedia ?? false);
  const canDelete = isSuperAdmin(typedUser) || (typedUser?.permissions?.canDeleteMedia ?? false);

  const getToken = useCallback(async () => {
    const currentUser = auth?.currentUser;
    return currentUser ? currentUser.getIdToken() : null;
  }, [auth]);

  const loadFiles = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/appwrite/media?search=${encodeURIComponent(search.trim())}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Could not load Appwrite media.');
      setFiles(data.files);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Appwrite library unavailable', description: error instanceof Error ? error.message : 'Could not load files.' });
    } finally {
      setIsLoading(false);
    }
  }, [getToken, search, toast]);

  useEffect(() => { void loadFiles(); }, [loadFiles]);

  const uploadFile = useCallback(async (file: File) => {
    const token = await getToken();
    if (!token) {
      toast({ variant: 'destructive', title: 'Not authenticated', description: 'Please sign in again to upload.' });
      return;
    }
    setIsUploading(true);
    setProgress(5);
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch('/api/appwrite/media', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Upload failed.');
      const uploaded = data.file as AppwriteAsset;
      setFiles((current) => [uploaded, ...current]);
      setActiveTab(tabFor(uploaded.resourceType));
      setProgress(100);
      toast({ title: 'Uploaded to Appwrite', description: uploaded.filename });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Appwrite upload failed', description: error instanceof Error ? error.message : 'Upload failed.' });
    } finally {
      window.setTimeout(() => setProgress(0), 300);
      setIsUploading(false);
    }
  }, [getToken, toast]);

  const deleteFile = useCallback(async (fileId: string) => {
    const token = await getToken();
    if (!token) return;
    try {
      const response = await fetch('/api/appwrite/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fileId }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Delete failed.');
      setFiles((current) => current.filter((file) => file.providerAssetId !== fileId));
      setSelectedIds((current) => { const next = new Set(current); next.delete(fileId); return next; });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Appwrite delete failed', description: error instanceof Error ? error.message : 'Delete failed.' });
    }
  }, [getToken, toast]);

  const visibleFiles = useMemo(() => files.filter((file) => {
    const matchesTab = activeTab === tabFor(file.resourceType);
    const needle = search.trim().toLowerCase();
    return matchesTab && (!needle || file.filename.toLowerCase().includes(needle));
  }), [activeTab, files, search]);

  const copyUrl = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied' });
    } catch {
      toast({ variant: 'destructive', title: 'Could not copy link' });
    }
  }, [toast]);

  const toggleSelection = (id: string) => setSelectedIds((current) => {
    const next = new Set(current);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} Appwrite file(s)? This cannot be undone.`)) return;
    await Promise.all([...selectedIds].map((id) => deleteFile(id)));
  };

  const iconFor = (type: MediaResourceType) => type === 'image' ? faFileImage : type === 'video' ? faFilm : faFileLines;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Appwrite files" className="max-w-xs" />
        <Button variant="outline" size="sm" onClick={() => void loadFiles()} disabled={isLoading}>
          <FontAwesomeIcon icon={faRotate} className="mr-2" /> Refresh
        </Button>
        {canUpload && <>
          <input ref={fileInputRef} type="file" className="hidden" onChange={(event) => {
            const file = event.target.files?.[0];
            event.currentTarget.value = '';
            if (file) void uploadFile(file);
          }} />
          <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            <FontAwesomeIcon icon={faUpload} className="mr-2" /> Upload
          </Button>
        </>}
        {canDelete && selectedIds.size > 0 && <Button variant="destructive" size="sm" onClick={() => void deleteSelected()}>
          <FontAwesomeIcon icon={faTrash} className="mr-2" /> Delete selected ({selectedIds.size})
        </Button>}
      </div>
      {isUploading && <Progress value={progress} aria-label="Appwrite upload progress" />}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AssetTab)}>
        <TabsList>
          <TabsTrigger value="images"><FontAwesomeIcon icon={faFileImage} className="mr-2" />Images</TabsTrigger>
          <TabsTrigger value="videos"><FontAwesomeIcon icon={faFilm} className="mr-2" />Videos</TabsTrigger>
          <TabsTrigger value="files"><FontAwesomeIcon icon={faFileLines} className="mr-2" />Files</TabsTrigger>
        </TabsList>
        {(['images', 'videos', 'files'] as AssetTab[]).map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            {isLoading ? <p className="text-sm text-muted-foreground">Loading Appwrite media…</p> : visibleFiles.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No {tab} in Appwrite.</p>
            ) : <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {visibleFiles.map((file) => <article key={file.providerAssetId} className="space-y-2 rounded-lg border p-2">
                <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded bg-muted">
                  {file.resourceType === 'image' ? (
                    // Appwrite hosts are user-configured, so Next Image remote-host allowlisting cannot be static here.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={file.url} alt={file.filename} className="h-full w-full object-cover" />
                  ) : <FontAwesomeIcon icon={iconFor(file.resourceType)} className="h-10 w-10 text-muted-foreground" />}
                  {canDelete && <Checkbox checked={selectedIds.has(file.providerAssetId)} onCheckedChange={() => toggleSelection(file.providerAssetId)} className="absolute left-2 top-2 bg-background" aria-label={`Select ${file.filename}`} />}
                </div>
                <p className="truncate text-xs" title={file.filename}>{file.filename}</p>
                <div className="flex gap-1">
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => void copyUrl(file.url)} title="Copy link"><FontAwesomeIcon icon={faCopy} /></Button>
                  {canDelete && <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => void deleteFile(file.providerAssetId)} title="Delete"><FontAwesomeIcon icon={faTrash} /></Button>}
                </div>
              </article>)}
            </div>}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
