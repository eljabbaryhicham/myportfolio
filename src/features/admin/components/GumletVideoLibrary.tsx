'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth, useUser } from '@/firebase';
import type { AppUser } from '@/firebase/auth/use-user';
import { isSuperAdmin } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { GumletVideoAsset, GumletOutputFormat } from '@/lib/gumlet-video';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faFilm, faRotate, faTrash, faUpload } from '@fortawesome/free-solid-svg-icons';

export default function GumletVideoLibrary() {
  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [assets, setAssets] = useState<GumletVideoAsset[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [format, setFormat] = useState<GumletOutputFormat>('ABR');

  const typedUser = user as AppUser | null;
  const canUpload = isSuperAdmin(typedUser) || (typedUser?.permissions?.canUploadMedia ?? false);
  const canDelete = isSuperAdmin(typedUser) || (typedUser?.permissions?.canDeleteMedia ?? false);
  const token = useCallback(() => auth?.currentUser?.getIdToken() ?? Promise.resolve(null), [auth]);

  const load = useCallback(async () => {
    const idToken = await token();
    if (!idToken) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/gumlet/video?search=${encodeURIComponent(search.trim())}`, { headers: { Authorization: `Bearer ${idToken}` } });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Could not load Gumlet videos.');
      setAssets(data.assets);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gumlet library unavailable', description: error instanceof Error ? error.message : 'Could not load videos.' });
    } finally { setIsLoading(false); }
  }, [search, toast, token]);

  useEffect(() => { void load(); }, [load]);

  const upload = async (file: File) => {
    const idToken = await token();
    if (!idToken) return;
    setIsUploading(true); setProgress(2);
    try {
      const intentResponse = await fetch('/api/gumlet/video', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ title: file.name.replace(/\.[^.]+$/, ''), format }),
      });
      const intentData = await intentResponse.json();
      if (!intentResponse.ok || !intentData.success) throw new Error(intentData.message || 'Could not create Gumlet upload.');
      const upload = intentData.upload as GumletVideoAsset & { uploadUrl: string };
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', upload.uploadUrl);
        xhr.upload.onprogress = (event) => { if (event.lengthComputable) setProgress(Math.max(2, Math.round((event.loaded / event.total) * 100))); };
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Gumlet upload failed (${xhr.status}).`));
        xhr.onerror = () => reject(new Error('Network error during Gumlet upload.'));
        xhr.send(file);
      });
      setAssets((current) => [{ ...upload, status: 'processing' }, ...current]);
      toast({ title: 'Uploaded to Gumlet', description: 'Video processing has started.' });
      void load();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gumlet upload failed', description: error instanceof Error ? error.message : 'Upload failed.' });
    } finally { setProgress(0); setIsUploading(false); }
  };

  const remove = async (assetId: string) => {
    const idToken = await token(); if (!idToken) return;
    try {
      const response = await fetch('/api/gumlet/video', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ assetId }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Delete failed.');
      setAssets((current) => current.filter((asset) => asset.assetId !== assetId));
    } catch (error) { toast({ variant: 'destructive', title: 'Gumlet delete failed', description: error instanceof Error ? error.message : 'Delete failed.' }); }
  };

  const copy = async (url?: string) => {
    if (!url) return;
    try { await navigator.clipboard.writeText(url); toast({ title: 'Playback URL copied' }); } catch { toast({ variant: 'destructive', title: 'Could not copy URL' }); }
  };

  return <section className="space-y-4">
    <div className="flex flex-wrap items-center gap-3">
      <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Gumlet videos" className="max-w-xs" />
      <Select value={format} onValueChange={(value) => setFormat(value as GumletOutputFormat)}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ABR">HLS / DASH</SelectItem><SelectItem value="MP4">MP4</SelectItem></SelectContent></Select>
      <Button variant="outline" size="sm" onClick={() => void load()} disabled={isLoading}><FontAwesomeIcon icon={faRotate} className="mr-2" />Refresh</Button>
      {canUpload && <><input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; event.currentTarget.value = ''; if (file) void upload(file); }} /><Button size="sm" disabled={isUploading} onClick={() => inputRef.current?.click()}><FontAwesomeIcon icon={faUpload} className="mr-2" />Upload video</Button></>}
    </div>
    {isUploading && <Progress value={progress} aria-label="Gumlet upload progress" />}
    {isLoading ? <p className="text-sm text-muted-foreground">Loading Gumlet videos…</p> : assets.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">No Gumlet videos found.</p> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {assets.map((asset) => <article key={asset.assetId} className="space-y-2 rounded-lg border p-3">
        <div className="flex aspect-video items-center justify-center overflow-hidden rounded bg-muted">{asset.thumbnailUrl ? <>
          {/* Gumlet delivery hosts are account-configured, so static Next Image allowlisting is not safe here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        </> : <FontAwesomeIcon icon={faFilm} className="h-10 w-10 text-muted-foreground" />}</div>
        <p className="truncate text-sm font-medium" title={asset.title}>{asset.title}</p><p className="text-xs text-muted-foreground">{asset.status}{asset.format ? ` · ${asset.format}` : ''}</p>
        <div className="flex gap-2"><Button size="sm" variant="outline" disabled={!asset.playbackUrl} onClick={() => void copy(asset.playbackUrl)}><FontAwesomeIcon icon={faCopy} className="mr-2" />Copy URL</Button>{canDelete && <Button size="sm" variant="destructive" onClick={() => void remove(asset.assetId)}><FontAwesomeIcon icon={faTrash} className="mr-2" />Delete</Button>}</div>
      </article>)}
    </div>}
  </section>;
}
