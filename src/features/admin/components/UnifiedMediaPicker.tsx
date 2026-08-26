'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileImage, faFilm, faFileLines, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import Preloader from '@/components/preloader';
import Image from 'next/image';

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
}

export default function UnifiedMediaPicker({ isOpen, onOpenChange, onMediaSelect }: UnifiedMediaPickerProps) {
  const { t } = useTranslation();
  const firestore = useFirestore();

  const [provider, setProvider] = useState<'cloudinary' | 'vercel'>('cloudinary');
  const [activeTab, setActiveTab] = useState<'images' | 'videos' | 'files'>('images');
  const [activeLibrary, setActiveLibrary] = useState<'primary' | 'extented'>('primary');
  const [searchQuery, setSearchQuery] = useState('');

  const mediaCollectionRef = useMemoFirebase(() => firestore ? query(collection(firestore, 'media'), orderBy('created_at', 'desc')) : null, [firestore]);
  const { data: mediaAssets, isLoading: isLoadingMedia } = useCollection<MediaAsset>(mediaCollectionRef);

  const vercelColRef = useMemoFirebase(() => firestore ? query(collection(firestore, 'vercel_blobs'), orderBy('uploadedAt', 'desc')) : null, [firestore]);
  const { data: vercelBlobs, isLoading: isLoadingVercel } = useCollection<VercelBlobDoc>(vercelColRef as any);

  const handleSelect = (url: string, type: 'image' | 'video' | 'raw', filename: string) => {
    onMediaSelect(url, type, filename);
    onOpenChange(false);
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
          <div key={file.id} className="flex flex-col gap-2 group cursor-pointer" onClick={() => handleSelect(file.url, file.resource_type, file.filename)}>
            <div className="relative aspect-square border rounded-lg overflow-hidden glass-effect p-1 group-hover:ring-2 group-hover:ring-primary transition-all">
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
            <div key={b.id} className="flex flex-col gap-2 group cursor-pointer" onClick={() => handleSelect(b.url, mappedType, b.filename)}>
              <div className="relative aspect-square border rounded-lg overflow-hidden glass-effect p-1 group-hover:ring-2 group-hover:ring-primary transition-all">
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-6xl h-[85vh] glass-effect p-0 flex flex-col">
        <DialogHeader className="p-4 border-b text-center">
          <DialogTitle className="font-headline">{t('mediaAdmin.chooseMedia') || 'Choose Media'}</DialogTitle>
          <p className="text-sm text-muted-foreground">Select from Cloudinary or Vercel Blob libraries</p>
        </DialogHeader>

        <Tabs value={provider} onValueChange={v => setProvider(v as any)} className="px-4 pt-3">
          <TabsList>
            <TabsTrigger value="cloudinary" className="glass-effect data-[state=active]:bg-destructive">Cloudinary</TabsTrigger>
            <TabsTrigger value="vercel" className="glass-effect data-[state=active]:bg-destructive">Vercel Blob</TabsTrigger>
          </TabsList>
        </Tabs>

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
  );
}
