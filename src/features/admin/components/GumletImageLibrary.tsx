'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import Preloader from '@/components/preloader';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

type Image = { id: string; sourceUrl: string; deliveryUrl: string; filename: string };

export default function GumletImageLibrary() {
  const auth = useAuth(); const { toast } = useToast();
  const [images, setImages] = useState<Image[]>([]); const [url, setUrl] = useState(''); const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const headers = useCallback(async () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${await auth?.currentUser?.getIdToken() ?? ''}` }), [auth]);
  const load = useCallback(async () => { setLoading(true); try { const r = await fetch('/api/gumlet/image', { headers: await headers() }); const d = await r.json(); if (!r.ok || !d.success) throw new Error(d.message); setImages(d.images); } catch (e) { toast({ variant: 'destructive', title: 'Gumlet Image unavailable', description: e instanceof Error ? e.message : 'Could not load images.' }); } finally { setLoading(false); } }, [headers, toast]);
  useEffect(() => { void load(); }, [load]);
  const add = async () => { try { const r = await fetch('/api/gumlet/image', { method: 'POST', headers: await headers(), body: JSON.stringify({ sourceUrl: url }) }); const d = await r.json(); if (!r.ok || !d.success) throw new Error(d.message); setImages((v) => [d.image, ...v]); setUrl(''); toast({ title: 'Image added' }); } catch (e) { toast({ variant: 'destructive', title: 'Could not add image', description: e instanceof Error ? e.message : 'Invalid image URL.' }); } };
  const remove = async (id: string) => { const r = await fetch('/api/gumlet/image', { method: 'DELETE', headers: await headers(), body: JSON.stringify({ id }) }); const d = await r.json(); if (r.ok && d.success) { setImages((v) => v.filter((x) => x.id !== id)); toast({ title: 'Image removed' }); } else { toast({ variant: 'destructive', title: 'Could not remove image', description: d.message }); } setDeleteTarget(null); };
  return <section className="space-y-4"><div className="flex gap-2"><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://allowed-origin.example/image.jpg" /><Button onClick={() => void add()} disabled={!url}><FontAwesomeIcon icon={faPlus} className="mr-2" />Add URL</Button></div><p className="text-xs text-muted-foreground">Images stay at their external origin; this library stores only the approved source URL and Gumlet delivery URL.</p>{loading ? <div className="flex justify-center py-12"><Preloader /></div> : <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">{images.map((image) => <article key={image.id} className="space-y-2 rounded-lg border p-2"><div className="aspect-square overflow-hidden rounded bg-muted">
    {/* The configured Gumlet host is dynamic, so static Next Image allowlisting is not safe here. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={image.deliveryUrl} alt={image.filename} className="h-full w-full object-cover" />
  </div><p className="truncate text-xs">{image.filename}</p><div className="flex gap-1"><Button size="icon" variant="outline" className="h-8 w-8" onClick={() => { navigator.clipboard.writeText(image.deliveryUrl); toast({ title: 'URL copied' }); }}><FontAwesomeIcon icon={faCopy} /></Button><Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => setDeleteTarget(image.id)}><FontAwesomeIcon icon={faTrash} /></Button></div></article>)}</div>}
    <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete image?</AlertDialogTitle>
          <AlertDialogDescription>This action cannot be undone. The image will be removed from the library.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => { if (deleteTarget) void remove(deleteTarget); }}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </section>;
}
