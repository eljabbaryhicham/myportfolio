
'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';
import React, { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faCopy, faTrash, faFilm, faFileImage, faImages, faXmark, faPlus, faEye, faFolderOpen, faLink, faUniversity, faStar, faPhotoFilm, faFileLines } from '@fortawesome/free-solid-svg-icons';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import Preloader from '@/components/preloader';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, useUser, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, orderBy, DocumentReference, where, getDocs, writeBatch } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AddFromUrlDialog from './AddFromUrlDialog';
import { deleteMediaAsset } from '@/ai/flows/delete-media';
import type { AppUser } from '@/firebase/auth/use-user';
import CdnClapprPlayer from '@/components/CdnClapprPlayer';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useUploadProgress } from '@/components/upload-progress-context';
import BulkActionBar from './BulkActionBar';


// Type for the media stored in Firestore
interface MediaAsset {
    id: string;
    url: string;
    public_id: string;
    resource_type: 'image' | 'video' | 'raw';
    created_at: string;
    filename: string;
    libraryId?: 'primary' | 'extented';
    videoFormat?: 'mp4' | 'm3u8' | 'webm';
    title?: string;
}

// --- Cloudinary delivery-format helpers (for "copy URL as...") ---
const CLOUDINARY_UPLOAD_RE = /\/(image|video|raw)\/upload\//;

const withTransform = (url: string, transform: string): string =>
  url.replace(CLOUDINARY_UPLOAD_RE, (m) => `${m}${transform}/`);

// Remove any transformation chain between /upload/ and the version segment.
const stripTransforms = (url: string): string =>
  url.replace(/^(.*?\/upload\/)(?:[^/]+)?(\/v\d+\/)/, '$1$2');

// Request a specific delivery format. Built from a CLEAN base (stored
// transforms like f_webm,q_auto must be stripped first, otherwise they chain
// with ours and the last format directive wins). fl_attachment forces the
// browser to download the exact derived bytes instead of streaming the
// default derivative. Video/image containers get their extension synced too.
const formatVariant = (url: string, fmt: 'mp4' | 'webm' | 'webp' | 'avif' | 'jpg' | 'png'): string => {
  const out = withTransform(stripTransforms(url), `f_${fmt},q_auto,fl_attachment`);
  return out.replace(/\.(m3u8|webm|mp4|mov|jpeg|jpg|png|gif|webp|avif)$/i, `.${fmt}`);
};

// Rebuild the HLS manifest URL the upload flow generates for every video
// (streaming profile derivative): /video/upload/sp_auto/v<ver>/<id>.m3u8
const hlsVariant = (url: string): string => {
  const stripped = stripTransforms(url).replace(/\.[a-z0-9]+$/i, '.m3u8');
  return withTransform(stripped, 'sp_auto');
};

const MediaFileCard = ({
  file,
  onDelete,
  onCopy,
  onPreview,
  onSetLogo,
  onSetBackground,
  isNewlyUploaded,
  onMediaSelect,
  isSelectionMode,
  canDelete,
  canEditContact,
  canEditHome,
  isSelected,
  onToggleSelect,
  showCheckbox,
  onRequestFormatSelect,
}: {
  file: MediaAsset;
  onDelete: (publicId: string, id: string, resourceType: string, libraryId: 'primary' | 'extented') => void;
  onCopy: (url: string) => void;
  onPreview: (file: MediaAsset) => void;
  onSetLogo: (url: string) => void;
  onSetBackground: (file: MediaAsset) => void;
  isNewlyUploaded: boolean;
  onMediaSelect: (url: string, type: 'image' | 'video' | 'raw', filename: string) => void;
  isSelectionMode: boolean;
  canDelete: boolean;
  canEditContact: boolean;
  canEditHome: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  showCheckbox?: boolean;
  onRequestFormatSelect?: (file: MediaAsset) => void;
}) => {
  const { t } = useTranslation();
  
  const handleDelete = () => {
    onDelete(file.public_id, file.id, file.resource_type, file.libraryId || 'primary');
  };

  const handleSelect = () => {
    if (onRequestFormatSelect && file.resource_type !== 'raw') {
      onRequestFormatSelect(file);
    } else {
      onMediaSelect(file.url, file.resource_type, file.filename);
    }
  };

  const fileName = file.filename || file.public_id.split('/').pop() || 'Untitled';
  
  return (
    <div className={cn("flex flex-col gap-2", isNewlyUploaded && 'animate-shake')}>
      <div 
        className={cn(
          "relative group aspect-square border rounded-lg overflow-hidden glass-effect p-1",
          isSelectionMode && "cursor-pointer",
          isSelected && "ring-2 ring-primary"
        )}
        onClick={isSelectionMode ? handleSelect : undefined}
      >
        {showCheckbox && !isSelectionMode && (
          <div className="absolute top-2 left-2 z-20" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect?.(file.id)}
              className="bg-background/80 backdrop-blur-sm"
            />
          </div>
        )}
        <div className="relative w-full h-full rounded-md overflow-hidden">
          {file.resource_type === 'image' ? (
            <Image src={file.url} alt={file.public_id} fill className="object-cover" />
          ) : file.resource_type === 'video' ? (
            <div className="w-full h-full bg-black flex items-center justify-center">
              <Image src={file.url.replace(/\.(webm|m3u8)$/, '.jpg').replace(/\.mp4$/, '.jpg')} alt={file.public_id} fill className="object-cover" />
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

        <div className={cn(
            "absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 z-10",
            isSelectionMode && "group-hover:opacity-100"
        )}>
           {isSelectionMode ? (
              <div className="text-white text-center">
                <FontAwesomeIcon icon={faImages} className="h-8 w-8 mb-2" />
                <p className="font-bold">{t('mediaAdmin.select')}</p>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-1 md:gap-2">
                <Button size="icon" variant="ghost" onClick={() => onPreview(file)} title={t('mediaAdmin.preview')} className="h-8 w-8 md:h-10 md:w-10 text-white glass-effect">
                  <FontAwesomeIcon icon={faEye} />
                </Button>
                {file.resource_type !== 'raw' && (
                  <Button size="icon" variant="default" onClick={() => onMediaSelect(file.url, file.resource_type, file.filename)} title={t('mediaAdmin.createProject')} className="h-8 w-8 md:h-10 md:w-10 glass-effect">
                    <FontAwesomeIcon icon={faPlus} />
                  </Button>
                )}
                {canEditHome && (
                  <Button size="icon" variant="secondary" onClick={() => onSetBackground(file)} title={t('mediaAdmin.setAsBackground')} className="h-8 w-8 md:h-10 md:w-10 glass-effect">
                    <FontAwesomeIcon icon={faPhotoFilm} />
                  </Button>
                )}
                {file.resource_type === 'image' && canEditContact && (
                  <Button size="icon" variant="secondary" onClick={() => onSetLogo(file.url)} title="Set as Logo" className="h-8 w-8 md:h-10 md:w-10 glass-effect">
                    <FontAwesomeIcon icon={faStar} />
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="secondary" title={t('mediaAdmin.copyUrl')} className="h-8 w-8 md:h-10 md:w-10 glass-effect">
                      <FontAwesomeIcon icon={faCopy} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuLabel>{t('mediaAdmin.copyFormat')}</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onCopy(stripTransforms(file.url))}>
                      {t('mediaAdmin.copy.default')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onCopy(withTransform(file.url, 'f_auto,q_auto'))}>
                      {t('mediaAdmin.copy.auto')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {file.resource_type === 'video' ? (
                      <>
                        <DropdownMenuItem onClick={() => onCopy(formatVariant(file.url, 'mp4'))}>
                          {t('mediaAdmin.copy.mp4')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onCopy(formatVariant(file.url, 'webm'))}>
                          {t('mediaAdmin.copy.webm')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onCopy(hlsVariant(file.url))}>
                          {t('mediaAdmin.copy.hls')}
                        </DropdownMenuItem>
                      </>
                    ) : file.resource_type === 'image' ? (
                      <>
                        <DropdownMenuItem onClick={() => onCopy(formatVariant(file.url, 'webp'))}>
                          WebP
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onCopy(formatVariant(file.url, 'avif'))}>
                          AVIF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onCopy(formatVariant(file.url, 'jpg'))}>
                          JPG
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onCopy(formatVariant(file.url, 'png'))}>
                          PNG
                        </DropdownMenuItem>
                      </>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
                {canDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="destructive" title={t('mediaAdmin.delete')} className="h-8 w-8 md:h-10 md:w-10">
                        <FontAwesomeIcon icon={faTrash} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="w-[80vw]">
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('mediaAdmin.confirmDelete')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('mediaAdmin.confirmDeleteDescription')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('mediaAdmin.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                          {t('mediaAdmin.delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}
        </div>
      </div>
      <p className="text-xs text-center text-muted-foreground truncate" title={fileName}>{fileName}</p>
    </div>
  );
};

interface StandaloneMediaAdminProps {
  isDialog?: false;
  onMediaSelect: (url: string, type: 'image' | 'video' | 'raw', filename: string) => void;
  onUploadComplete: (docId: string, resourceType: 'image' | 'video' | 'raw', libraryId: 'primary' | 'extented') => void;
  onLibraryOpenRequest: () => void;
  isOpen?: never;
  onOpenChange?: never;
  isSelectionMode?: never;
  onSelectionComplete?: never;
  activeTab?: never;
  setActiveTab?: never;
  activeLibrary?: never;
  setActiveLibrary?: never;
  newlyUploadedId?: never;
}

interface DialogMediaAdminProps {
  isDialog: true;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onMediaSelect: (url: string, type: 'image' | 'video' | 'raw', filename: string) => void;
  isSelectionMode: boolean;
  onSelectionComplete: () => void;
  activeTab: 'images' | 'videos' | 'files';
  setActiveTab: (tab: 'images' | 'videos' | 'files') => void;
  activeLibrary: 'primary' | 'extented';
  setActiveLibrary: (library: 'primary' | 'extented') => void;
  newlyUploadedId: string | null;
  onUploadComplete?: never;
  onLibraryOpenRequest?: never;
}

type MediaAdminProps = StandaloneMediaAdminProps | DialogMediaAdminProps;

export default function MediaAdmin(props: MediaAdminProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const { startUpload: startGlobalUpload, updateProgress: updateGlobalProgress, finishUpload: finishGlobalUpload, isUploading: globalIsUploading, progress: globalProgress, fileName: globalFileName } = useUploadProgress();

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState('');
  // Effective values for inline progress when navigating back — show global progress if local is not uploading
  const effectiveIsUploading = isUploading || globalIsUploading;
  const effectiveProgress = isUploading ? uploadProgress : globalProgress;
  const effectiveFileName = isUploading ? uploadingFileName : globalFileName;
  const [previewFile, setPreviewFile] = useState<MediaAsset | null>(null);
  const [isAddFromUrlOpen, setIsAddFromUrlOpen] = useState(false);
  const [isChoosingLibrary, setIsChoosingLibrary] = useState(false);
  const [formatChoiceAsset, setFormatChoiceAsset] = useState<MediaAsset | null>(null);
  const [isChoosingVideoFormat, setIsChoosingVideoFormat] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [uploadVideoFormat, setUploadVideoFormat] = useState<'mp4' | 'm3u8' | 'webm'>('mp4');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  
  // State for setting background
  const [isSetBackgroundOpen, setIsSetBackgroundOpen] = useState(false);
  const [backgroundTarget, setBackgroundTarget] = useState<'home' | 'website'>('home');
  const [backgroundFile, setBackgroundFile] = useState<MediaAsset | null>(null);

  const activeTab = props.isDialog ? props.activeTab : 'images';
  const setActiveTab = props.isDialog ? props.setActiveTab : () => {};
  const activeLibrary = props.isDialog ? props.activeLibrary : 'primary';
  const setActiveLibrary = props.isDialog ? props.setActiveLibrary : () => {};
  
  const newlyUploadedId = props.isDialog ? props.newlyUploadedId : null;

  const typedUser = user as AppUser | null;
  const isSuperAdmin = typedUser?.email === 'eljabbaryhicham@example.com';
  const canUpload = isSuperAdmin || (typedUser?.permissions?.canUploadMedia ?? true);
  const canDelete = isSuperAdmin || (typedUser?.permissions?.canDeleteMedia ?? true);
  const canEditHome = isSuperAdmin || (typedUser?.permissions?.canEditHome ?? true);
  const canEditContact = isSuperAdmin || (typedUser?.permissions?.canEditContact ?? true);


  // Fetch media assets from Firestore
  const mediaCollectionRef = useMemoFirebase(() => firestore ? query(collection(firestore, 'media'), orderBy('created_at', 'desc')) : null, [firestore]);
  const { data: mediaAssets, isLoading: isLoadingMedia } = useCollection<MediaAsset>(mediaCollectionRef);

  const [searchQuery, setSearchQuery] = useState('');

  const { imageAssets, videoAssets, otherAssets } = useMemo(() => {
    const images: MediaAsset[] = [];
    const videos: MediaAsset[] = [];
    const others: MediaAsset[] = [];
    const q = searchQuery.trim().toLowerCase();
    mediaAssets?.forEach(asset => {
        const libraryMatch = asset.libraryId === activeLibrary || (activeLibrary === 'primary' && !asset.libraryId);
        const matchesSearch =
          !q ||
          asset.filename?.toLowerCase().includes(q) ||
          asset.title?.toLowerCase().includes(q);
        if (libraryMatch && matchesSearch) {
            if (asset.resource_type === 'image') {
                images.push(asset);
            } else if (asset.resource_type === 'video') {
                videos.push(asset);
            } else {
                others.push(asset);
            }
        }
    });
    return { imageAssets: images, videoAssets: videos, otherAssets: others };
  }, [mediaAssets, activeLibrary, searchQuery]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!canUpload) {
      toast({
        variant: 'destructive',
        title: t('mediaAdmin.toast.permissionDenied.title'),
        description: t('mediaAdmin.toast.permissionDenied.description'),
      });
      return;
    }
    setFilesToUpload(acceptedFiles);
    
    // If any of the files are videos, ask for format choice. Otherwise, just ask for library.
    if (acceptedFiles.some(file => file.type.startsWith('video/'))) {
        setIsChoosingVideoFormat(true);
    } else {
        setUploadVideoFormat('mp4'); // Default for non-videos
        setIsChoosingLibrary(true);
    }
  }, [canUpload, toast, t]);
  
  const handleLibraryChoiceAndUpload = useCallback(async (libraryId: 'primary' | 'extented') => {
    setIsChoosingLibrary(false);
    
    let cloudName, uploadPreset;

    if (libraryId === 'primary') {
        cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_1;
        uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_1;
    } else { // extented
        cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_2;
        uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_2;
    }

    if (!cloudName || !uploadPreset || uploadPreset.includes("your_unsigned_preset")) {
      toast({
        variant: 'destructive',
        title: t('mediaAdmin.toast.configError.title'),
        description: t('mediaAdmin.toast.configError.description').replace('{library}', libraryId === 'primary' ? 'Library Primary' : 'Library Extented'),
        duration: 10000,
      });
      setFilesToUpload([]);
      return;
    }

    setIsUploading(true);
    if (filesToUpload.length > 0) startGlobalUpload(filesToUpload[0].name, 'cloudinary');

    for (const file of filesToUpload) {
      setUploadingFileName(file.name);
      setUploadProgress(0);
      updateGlobalProgress(0);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
          updateGlobalProgress(progress);
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);

          let finalUrl = response.secure_url;
          if (response.resource_type === 'video' && uploadVideoFormat === 'm3u8') {
             finalUrl = `https://res.cloudinary.com/${cloudName}/video/upload/sp_auto/v${response.version}/${response.public_id}.m3u8`;
          } else if (response.resource_type === 'video' && uploadVideoFormat === 'webm') {
             finalUrl = finalUrl.replace(`/upload/`, `/upload/f_webm,q_auto/`);
          } else if (response.resource_type === 'video' || response.resource_type === 'image') {
             finalUrl = finalUrl.replace(`/upload/`, `/upload/f_auto,q_auto/`);
          }
          
          if(firestore) {
              const mediaData = {
                  public_id: response.public_id,
                  url: finalUrl,
                  resource_type: response.resource_type,
                  created_at: response.created_at,
                  filename: file.name,
                  libraryId: libraryId,
                  ...(response.resource_type === 'video' && { videoFormat: uploadVideoFormat }),
              };
              
              const docRefPromise = addDocumentNonBlocking(collection(firestore, 'media'), mediaData);

              const docRef = await docRefPromise as DocumentReference | undefined;

              if (docRef && !props.isDialog && props.onUploadComplete) {
                  props.onUploadComplete(docRef.id, response.resource_type, libraryId);
              }
          }

          toast({
            title: t('mediaAdmin.toast.uploadSuccessful.title'),
            description: t('mediaAdmin.toast.uploadSuccessful.description').replace('{file}', file.name).replace('{library}', libraryId === 'primary' ? 'Library Primary' : 'Library Extented'),
          });
        } else {
          const error = JSON.parse(xhr.responseText).error;
          toast({
            variant: 'destructive',
            title: t('mediaAdmin.toast.uploadFailed.title').replace('{file}', file.name),
            description: t('mediaAdmin.toast.uploadFailed.description').replace('{error}', error.message || 'An unknown error occurred.'),
          });
        }
      };
      
      xhr.onerror = () => {
         toast({
            variant: 'destructive',
            title: t('mediaAdmin.toast.uploadFailedNetwork.title').replace('{file}', file.name),
            description: t('mediaAdmin.toast.uploadFailedNetwork.description'),
          });
      }

      xhr.send(formData);

      await new Promise(resolve => {
        xhr.onloadend = resolve;
      });
    }

    setIsUploading(false);
    setUploadingFileName('');
    setUploadProgress(0);
    finishGlobalUpload();
    setFilesToUpload([]);

  }, [filesToUpload, toast, firestore, props, uploadVideoFormat, t, startGlobalUpload, updateGlobalProgress, finishGlobalUpload]);


  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg'],
      'video/*': ['.mp4', '.mov', '.webm'],
      'text/vtt': ['.vtt'],
      'application/json': ['.json'],
    },
    disabled: !canUpload || effectiveIsUploading,
  });
  
  const handleDelete = async (publicId: string, docId: string, resourceType: string, libraryId: 'primary' | 'extented') => {
    if (!firestore || !canDelete) return;

    try {
        // 1. Destroy the binary asset in Cloudinary (signed server-side call).
        const result = await deleteMediaAsset({
          publicId,
          resourceType: (['image', 'video', 'raw'].includes(resourceType) ? resourceType : 'image') as 'image' | 'video' | 'raw',
          libraryId,
        });

        // 2. Remove the Firestore metadata doc either way — the library must stay consistent.
        await deleteDocumentNonBlocking(doc(firestore, 'media', docId));

        if (result.success) {
            toast({ title: t('mediaAdmin.toast.fileRemoved.title'), description: t('mediaAdmin.toast.fileRemoved.description')});
        } else {
            toast({ variant: 'destructive', title: t('mediaAdmin.toast.cloudinaryCleanupFailed.title'), description: t('mediaAdmin.toast.cloudinaryCleanupFailed.description').replace('{error}', result.message)});
        }
    } catch(e: any) {
        toast({ variant: 'destructive', title: t('mediaAdmin.toast.deletionFailed.title'), description: t('mediaAdmin.toast.deletionFailed.description').replace('{error}', e.message)});
    }
  };

  const handleSetLogo = (url: string) => {
    if (!firestore || !canEditContact) return;
    const settingsDocRef = doc(firestore, 'homepage', 'settings');
    setDocumentNonBlocking(settingsDocRef, { homePageLogoUrl: url }, { merge: true });
    toast({
        title: t('mediaAdmin.toast.logoUpdated.title'),
        description: t('mediaAdmin.toast.logoUpdated.description'),
    });
  }

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: t('mediaAdmin.toast.copied.title'), description: t('mediaAdmin.toast.copied.description')});
  }

  const handleConfirmFormatPick = (url: string) => {
    if (!formatChoiceAsset) return;
    const { resource_type, filename } = formatChoiceAsset;
    handleMediaSelect(url, resource_type, filename);
    setFormatChoiceAsset(null);
  };

  const handleMediaSelect = (url: string, type: 'image' | 'video' | 'raw', filename: string) => {
    if(props.isDialog) {
        props.onMediaSelect(url, type, filename);
        props.onSelectionComplete();
    } else if (props.onMediaSelect) {
        props.onMediaSelect(url, type, filename);
    }
  };

  const showBulkSelect = canDelete && !(props.isDialog && props.isSelectionMode);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (!firestore || !canDelete) return;

    // Destroy each binary asset in Cloudinary first (best-effort, in parallel).
    const results = await Promise.allSettled(
      (mediaAssets || [])
        .filter(a => selectedIds.has(a.id))
        .map(a => deleteMediaAsset({
          publicId: a.public_id,
          resourceType: (['image', 'video', 'raw'].includes(a.resource_type) ? a.resource_type : 'image') as 'image' | 'video' | 'raw',
          libraryId: a.libraryId || 'primary',
        }))
    );

    const failedCount = results.filter(r => r.status === 'rejected' || !r.value.success).length;

    const batch = writeBatch(firestore);
    selectedIds.forEach(id => {
      batch.delete(doc(firestore, 'media', id));
    });
    await batch.commit();

    if (failedCount > 0) {
      toast({ variant: 'destructive', title: t('mediaAdmin.toast.cloudinaryCleanupFailed.title'), description: t('mediaAdmin.toast.cloudinaryCleanupFailed.bulk').replace('{count}', String(failedCount)) });
    } else {
      toast({ title: t('mediaAdmin.toast.fileRemoved.title'), description: `Deleted ${selectedIds.size} files.` });
    }
    setSelectedIds(new Set());
    setIsBulkDeleteOpen(false);
  };
  
  const handleUrlUploadComplete = (mediaId: string, resourceType: 'image' | 'video' | 'raw', libraryId: 'primary' | 'extented') => {
    if (!props.isDialog && props.onUploadComplete) {
      props.onUploadComplete(mediaId, resourceType, libraryId);
    }
  };

  const handleOpenSetBackgroundDialog = (file: MediaAsset) => {
    if (!canEditHome) return;
    setBackgroundFile(file);
    setIsSetBackgroundOpen(true);
  };
  
  const handleConfirmSetBackground = async () => {
    if (!firestore || !backgroundFile || !canEditHome) return;

    let mediaIdForDb = backgroundFile.id;
    const mediaTypeForDb = backgroundFile.resource_type === 'video' ? 'video' : 'image';
    
    // If it's a video, ensure a project exists.
    if (mediaTypeForDb === 'video') {
        const projectsRef = collection(firestore, 'projects');
        const q = query(projectsRef, where("sourceUrl", "==", backgroundFile.url));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            mediaIdForDb = querySnapshot.docs[0].id;
        } else {
            const newProjectRef = doc(projectsRef);
            mediaIdForDb = newProjectRef.id;

            const batch = writeBatch(firestore);
            const title = backgroundFile.filename.split('.').slice(0, -1).join('.') || 'New Background Project';
            
            batch.set(newProjectRef, {
                title: title,
                description: "Automatically created for background video.",
                type: 'video',
                sourceUrl: backgroundFile.url,
                thumbnailUrl: backgroundFile.url.replace(/\.(mp4|m3u8|webm)$/, '.jpg'),
                isVisible: false,
                order: 999,
            });
            await batch.commit();
            toast({ title: t('mediaAdmin.toast.projectCreated.title'), description: t('mediaAdmin.toast.projectCreated.description')});
        }
    }

    const settingsDocRef = doc(firestore, 'homepage', 'settings');
    const fieldToUpdateId = backgroundTarget === 'home' ? 'homePageBackgroundMediaId' : 'websiteBackgroundMediaId';
    const fieldToUpdateType = backgroundTarget === 'home' ? 'homePageBackgroundType' : 'websiteBackgroundType';
    const fieldToUpdateUrl = backgroundTarget === 'home' ? 'homePageBackgroundUrl' : 'websiteBackgroundUrl';

    setDocumentNonBlocking(settingsDocRef, {
      [fieldToUpdateId]: mediaIdForDb,
      [fieldToUpdateType]: mediaTypeForDb,
      [fieldToUpdateUrl]: backgroundFile.url,
    }, { merge: true });

    toast({
        title: t('mediaAdmin.toast.backgroundUpdated.title'),
        description: t('mediaAdmin.toast.backgroundUpdated.description').replace('{page}', backgroundTarget === 'home' ? 'Homepage' : 'Other Pages'),
    });
    
    setIsSetBackgroundOpen(false);
  };


  const renderLibrary = (assets: MediaAsset[], type: 'image' | 'video' | 'raw') => {
    if (isLoadingMedia) {
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
            {assets.map(file => (
                <MediaFileCard 
                  key={file.id} 
                  file={file} 
                  onDelete={handleDelete} 
                  onCopy={handleCopy}
                  onPreview={setPreviewFile}
                  onSetLogo={handleSetLogo}
                  onSetBackground={handleOpenSetBackgroundDialog}
                  isNewlyUploaded={file.id === newlyUploadedId}
                  onMediaSelect={handleMediaSelect}
                  onRequestFormatSelect={(f) => setFormatChoiceAsset(f)}
                  isSelectionMode={!!(props.isDialog && props.isSelectionMode)}
                  canDelete={canDelete}
                  canEditContact={canEditContact}
                  canEditHome={canEditHome}
                  isSelected={selectedIds.has(file.id)}
                  onToggleSelect={handleToggleSelect}
                  showCheckbox={showBulkSelect}
                />
            ))}
        </div>
    );
  }

  const renderPreviewContent = () => {
    if (!previewFile) return null;

    if (previewFile.resource_type === 'image') {
      return (
        <div className="relative w-full h-full">
          <Image
            src={previewFile.url}
            alt={previewFile.filename}
            fill
            className="object-contain"
          />
        </div>
      );
    }

    if (previewFile.resource_type === 'video' && previewFile.url) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <CdnClapprPlayer 
            source={previewFile.url}
          />
        </div>
      );
    }
    return null;
  };

  const commonDialogContent = (
    <>
      <DialogHeader className="p-4 border-b text-center">
          <DialogTitle className="font-headline">{props.isDialog && props.isSelectionMode ? t('mediaAdmin.chooseMedia') : t('mediaAdmin.mediaLibrary')}</DialogTitle>
           <DialogDescription>{t('mediaAdmin.description')}</DialogDescription>
      </DialogHeader>
        <Tabs value={activeLibrary} onValueChange={(value) => setActiveLibrary(value as 'primary' | 'extented')} className='px-4 pt-4'>
            <TabsList>
                <TabsTrigger value="primary" className="py-2 px-4 text-base glass-effect data-[state=active]:bg-destructive">{t('mediaAdmin.tab.libraryPrimary')}</TabsTrigger>
                <TabsTrigger value="extented" className="py-2 px-4 text-base glass-effect data-[state=active]:bg-destructive">{t('mediaAdmin.tab.libraryExtented')}</TabsTrigger>
            </TabsList>
        </Tabs>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'images' | 'videos' | 'files')} className="flex-1 flex flex-col min-h-0">
          <div className='px-4 pt-4 flex items-center gap-2 flex-wrap'>
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
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('mediaAdmin.searchPlaceholder')}
              className="max-w-[220px] md:max-w-xs ml-auto glass-effect"
            />
          </div>

          {/* Upload strip — also available while picking media from a form */}
          <div className="px-4 pt-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div
                {...getRootProps()}
                className={cn(
                  'flex-1 border border-dashed rounded-md px-3 py-2 flex items-center justify-center gap-2 cursor-pointer transition-colors text-muted-foreground min-w-0',
                  isDragActive && canUpload ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50',
                  (!canUpload || effectiveIsUploading) && 'opacity-50 cursor-not-allowed'
                )}
              >
                <input {...getInputProps()} disabled={!canUpload || effectiveIsUploading} />
                <FontAwesomeIcon icon={faCloudUploadAlt} className="h-4 w-4 shrink-0" />
                <span className="text-xs md:text-sm truncate text-center">
                  {effectiveIsUploading ? t('mediaAdmin.uploading') : !canUpload ? t('mediaAdmin.noPermission') : t('mediaAdmin.dragAndDrop')}
                </span>
              </div>
              <Button onClick={() => setIsAddFromUrlOpen(true)} variant="outline" size="sm" disabled={!canUpload || effectiveIsUploading} className="w-full sm:w-auto justify-center shrink-0">
                <FontAwesomeIcon icon={faLink} className="mr-2" />
                {t('mediaAdmin.addFromUrl')}
              </Button>
            </div>
            {effectiveIsUploading && (
              <div className="mt-2 flex items-center gap-2 min-w-0">
                <Progress value={effectiveProgress} className="flex-1" />
                <span className="text-xs text-muted-foreground truncate max-w-[45%]">
                  {t('mediaAdmin.uploadProgress').replace('{name}', effectiveFileName).replace('{progress}', String(Math.round(effectiveProgress)))}
                </span>
              </div>
            )}
          </div>
          
          <ScrollArea className="flex-1">
              <TabsContent value="images" className="p-4 m-0">
                  {renderLibrary(imageAssets, 'image')}
              </TabsContent>
              <TabsContent value="videos" className="p-4 m-0">
                  {renderLibrary(videoAssets, 'video')}
              </TabsContent>
               <TabsContent value="files" className="p-4 m-0">
                  {renderLibrary(otherAssets, 'raw')}
              </TabsContent>
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
      <DialogClose className={cn(
          "absolute right-4 top-4 h-8 w-8",
          "flex items-center justify-center rounded-full transition-opacity",
          "bg-destructive text-destructive-foreground opacity-70 hover:opacity-100",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:pointer-events-none"
      )}>
          <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          <span className="sr-only">{t('mediaAdmin.close')}</span>
      </DialogClose>
    </>
  );

  const previewDialog = (
    <Dialog open={!!previewFile} onOpenChange={(isOpen) => !isOpen && setPreviewFile(null)}>
      <DialogContent className="w-[80vw] h-[90vh] glass-effect p-0 flex flex-col items-center justify-center bg-black/80 border-0">
        <DialogHeader className="absolute top-4 left-4 z-10">
          <DialogTitle className="text-white/80 font-headline">{previewFile?.filename}</DialogTitle>
        </DialogHeader>
        {renderPreviewContent()}
        <DialogClose className={cn(
          "absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:opacity-100 transition-opacity"
        )}>
          <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          <span className="sr-only">{t('mediaAdmin.close')}</span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
  
  const setBackgroundDialog = (
    <Dialog open={isSetBackgroundOpen} onOpenChange={setIsSetBackgroundOpen}>
        <DialogContent className="w-[80vw]">
            <DialogHeader>
                <DialogTitle>{t('mediaAdmin.setAsBackground')}</DialogTitle>
                <DialogDescription>
                    {t('mediaAdmin.setAsBackgroundDescription')}
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                 <RadioGroup defaultValue="home" value={backgroundTarget} onValueChange={(value: 'home' | 'website') => setBackgroundTarget(value)}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="home" id="bg-home" />
                        <Label htmlFor="bg-home">{t('mediaAdmin.homepageOnly')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="website" id="bg-website" />
                        <Label htmlFor="bg-website">{t('mediaAdmin.otherPages')}</Label>
                    </div>
                </RadioGroup>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsSetBackgroundOpen(false)}>{t('mediaAdmin.cancel')}</Button>
                <Button onClick={handleConfirmSetBackground}>{t('mediaAdmin.confirm')}</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );

  // Video-format + library-choice steps — needed by BOTH the full-page
  // library and the compact picker dialog (upload strip lives in both).
  const uploadFlowDialogs = (
    <>
      <Dialog open={isChoosingVideoFormat} onOpenChange={setIsChoosingVideoFormat}>
        <DialogContent className="w-[80vw]">
            <DialogHeader>
                <DialogTitle>{t('mediaAdmin.chooseVideoFormat')}</DialogTitle>
                <DialogDescription>{t('mediaAdmin.chooseVideoFormatDescription')}</DialogDescription>
            </DialogHeader>
            <RadioGroup defaultValue="mp4" onValueChange={(value: 'mp4' | 'm3u8' | 'webm') => setUploadVideoFormat(value)}>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mp4" id="r1" />
                    <Label htmlFor="r1">{t('mediaAdmin.mp4')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="m3u8" id="r2" />
                    <Label htmlFor="r2">{t('mediaAdmin.m3u8')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="webm" id="r3" />
                    <Label htmlFor="r3">{t('mediaAdmin.webm')}</Label>
                </div>
            </RadioGroup>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsChoosingVideoFormat(false)}>{t('mediaAdmin.cancel')}</Button>
                <Button onClick={() => { setIsChoosingVideoFormat(false); setIsChoosingLibrary(true); }}>{t('mediaAdmin.next')}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!formatChoiceAsset} onOpenChange={(open) => { if (!open) setFormatChoiceAsset(null); }}>
        <DialogContent className="w-[80vw] max-w-md">
            <DialogHeader>
                <DialogTitle>{t('mediaAdmin.pickFormat.title')}</DialogTitle>
                <DialogDescription className="truncate">{formatChoiceAsset?.filename}</DialogDescription>
            </DialogHeader>
            {formatChoiceAsset && (
                <div className="grid grid-cols-2 gap-2 py-2">
                    <Button variant="outline" onClick={() => handleConfirmFormatPick(stripTransforms(formatChoiceAsset.url))}>{t('mediaAdmin.copy.default')}</Button>
                    {formatChoiceAsset.resource_type === 'video' && (
                        <>
                            <Button variant="outline" onClick={() => handleConfirmFormatPick(formatVariant(formatChoiceAsset.url, 'mp4'))}>{t('mediaAdmin.copy.mp4')}</Button>
                            <Button variant="outline" onClick={() => handleConfirmFormatPick(formatVariant(formatChoiceAsset.url, 'webm'))}>{t('mediaAdmin.copy.webm')}</Button>
                            <Button variant="outline" onClick={() => handleConfirmFormatPick(hlsVariant(formatChoiceAsset.url))}>{t('mediaAdmin.copy.hls')}</Button>
                        </>
                    )}
                    {formatChoiceAsset.resource_type === 'image' && (
                        <>
                            <Button variant="outline" onClick={() => handleConfirmFormatPick(formatVariant(formatChoiceAsset.url, 'webp'))}>WebP</Button>
                            <Button variant="outline" onClick={() => handleConfirmFormatPick(formatVariant(formatChoiceAsset.url, 'avif'))}>AVIF</Button>
                            <Button variant="outline" onClick={() => handleConfirmFormatPick(formatVariant(formatChoiceAsset.url, 'jpg'))}>JPG</Button>
                            <Button variant="outline" onClick={() => handleConfirmFormatPick(formatVariant(formatChoiceAsset.url, 'png'))}>PNG</Button>
                        </>
                    )}
                </div>
            )}
             <DialogFooter>
                <Button variant="ghost" onClick={() => setFormatChoiceAsset(null)}>{t('mediaAdmin.cancel')}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isChoosingLibrary} onOpenChange={setIsChoosingLibrary}>
        <DialogContent className="w-[80vw]">
            <DialogHeader>
                <DialogTitle>{t('mediaAdmin.chooseLibrary')}</DialogTitle>
                <DialogDescription>{t('mediaAdmin.chooseLibraryDescription')}</DialogDescription>
            </DialogHeader>
            <div className="flex justify-center gap-4 py-4">
                <Button onClick={() => handleLibraryChoiceAndUpload('primary')} size="lg" className="w-48"><FontAwesomeIcon icon={faUniversity} className="mr-2"/> {t('mediaAdmin.libraryPrimary')}</Button>
                <Button onClick={() => handleLibraryChoiceAndUpload('extented')} size="lg" className="w-48"><FontAwesomeIcon icon={faUniversity} className="mr-2"/> {t('mediaAdmin.libraryExtented')}</Button>
            </div>
             <DialogFooter>
                <Button variant="outline" onClick={() => setIsChoosingLibrary(false)}>{t('mediaAdmin.cancel')}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  if (props.isDialog) {
      return (
        <>
          <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
              <DialogContent className="w-[80vw] h-[90vh] glass-effect p-0 flex flex-col">
                  {commonDialogContent}
              </DialogContent>
          </Dialog>
          {previewDialog}
           <AddFromUrlDialog
            isOpen={isAddFromUrlOpen}
            onOpenChange={setIsAddFromUrlOpen}
            onUploadComplete={handleUrlUploadComplete}
          />
          {setBackgroundDialog}
          {uploadFlowDialogs}
          <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
            <AlertDialogContent className="w-[80vw]">
              <AlertDialogHeader>
                <AlertDialogTitle>{t('mediaAdmin.confirmDelete')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('mediaAdmin.confirmDeleteDescription')} ({selectedIds.size} files)
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('mediaAdmin.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {t('mediaAdmin.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      );
  }

  return (
    <>
      <div className="flex-1 flex flex-col h-full gap-6">
        <div className="flex items-start justify-between">
            <div className="text-left">
                <h2 className="text-xl font-headline">{t('mediaAdmin.mediaLibrary')}</h2>
                <p className="text-muted-foreground mt-1 text-sm">{t('mediaAdmin.description')}</p>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={props.onLibraryOpenRequest} variant="outline" size="sm">
                    <FontAwesomeIcon icon={faFolderOpen} className="mr-2" />
                    {t('mediaAdmin.browseFullLibrary')}
                </Button>
            </div>
        </div>
        <Separator className="bg-white/10" />
        <div className="border rounded-lg p-6 glass-effect flex flex-col gap-4">
            <div 
                {...getRootProps()} 
                className={cn(
                    'flex-1 border-2 border-dashed rounded-lg p-6 text-center transition-colors relative cursor-pointer', 
                    isDragActive && canUpload ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50', 
                    (!canUpload || effectiveIsUploading) && 'opacity-50 cursor-not-allowed'
                )}
            >
                <input {...getInputProps()} disabled={!canUpload || effectiveIsUploading} />
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <FontAwesomeIcon icon={faCloudUploadAlt} className="h-8 w-8" />
                    {isUploading ? (
                        <p className="text-sm">{t('mediaAdmin.uploading')}</p>
                    ) : !canUpload ? (
                        <p className="text-sm text-destructive-foreground/70">{t('mediaAdmin.noPermission')}</p>
                    ) : (
                       <p className="text-sm">{t('mediaAdmin.dragAndDrop')}</p>
                    )}
                </div>
            </div>
            <Button onClick={() => setIsAddFromUrlOpen(true)} variant="outline" size="sm" className="w-full" disabled={!canUpload || effectiveIsUploading}>
                <FontAwesomeIcon icon={faLink} className="mr-2" />
                {t('mediaAdmin.addFromUrl')}
            </Button>
          {effectiveIsUploading && (
              <div className="mt-4">
                  <Progress value={effectiveProgress} className="w-full" />
                  <p className="text-sm text-center mt-2 text-muted-foreground">
                    {t('mediaAdmin.uploadProgress').replace('{name}', effectiveFileName).replace('{progress}', String(Math.round(effectiveProgress)))}
                  </p>
              </div>
          )}
        </div>
      </div>
      {previewDialog}
      {setBackgroundDialog}
      <AddFromUrlDialog
        isOpen={isAddFromUrlOpen}
        onOpenChange={setIsAddFromUrlOpen}
        onUploadComplete={handleUrlUploadComplete}
      />
      {uploadFlowDialogs}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onDelete={() => setIsBulkDeleteOpen(true)}
      />
      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent className="w-[80vw]">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('mediaAdmin.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('mediaAdmin.confirmDeleteDescription')} ({selectedIds.size} files)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('mediaAdmin.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('mediaAdmin.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
