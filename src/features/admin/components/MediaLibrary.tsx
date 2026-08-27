'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';
import { SUPERADMIN_EMAIL } from '@/lib/constants';
import React, { useCallback, useState, useEffect, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faCopy, faTrash, faFilm, faFileImage, faFileLines, faXmark, faPlus, faEye, faFolderOpen, faLink, faUniversity, faStar, faPhotoFilm, faSpinner, faMinus } from '@fortawesome/free-solid-svg-icons';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import Preloader from '@/components/preloader';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, useUser, useAuth, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, orderBy, DocumentReference, where, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { upload } from '@vercel/blob/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MediaLibraryProvider = 'cloudinary' | 'vercel_blob';

// Cloudinary asset
export interface MediaAsset {
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

// Vercel Blob document
interface VercelBlobDoc {
  id: string;
  provider: 'vercel_blob';
  url: string;
  pathname: string;
  size: number;
  contentType: string;
  filename: string;
  uploadedAt?: any;
}

// Unified file type used internally
type UnifiedFile = {
  id: string;
  url: string;
  filename: string;
  resourceType: 'image' | 'video' | 'raw';
  size?: number;
  contentType?: string;
  // Cloudinary-specific (kept for delete/copy operations)
  public_id?: string;
  libraryId?: 'primary' | 'extented';
  videoFormat?: 'mp4' | 'm3u8' | 'webm';
  // Raw Firestore doc reference for deletion
  _raw: MediaAsset | VercelBlobDoc;
};

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

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MediaLibraryBaseProps {
  provider: MediaLibraryProvider;
  onUploadComplete?: (docId: string, resourceType: string, libraryId?: string) => void;
  className?: string;
}

interface StandaloneMediaLibraryProps extends MediaLibraryBaseProps {
  isDialog?: false;
  onMediaSelect?: (url: string, type: 'image' | 'video' | 'raw', filename: string) => void;
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

interface DialogMediaLibraryProps extends MediaLibraryBaseProps {
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
}

type MediaLibraryProps = StandaloneMediaLibraryProps | DialogMediaLibraryProps;

export interface MediaLibraryRef {
  openFullLibrary: (tab: 'images' | 'videos' | 'files', library: 'primary' | 'extented') => void;
}

// ---------------------------------------------------------------------------
// File Card
// ---------------------------------------------------------------------------

const FileCard = ({
  file,
  provider,
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
  file: UnifiedFile;
  provider: MediaLibraryProvider;
  onDelete: (file: UnifiedFile) => void;
  onCopy: (url: string) => void;
  onPreview: (file: UnifiedFile) => void;
  onSetLogo: (url: string) => void;
  onSetBackground: (file: UnifiedFile) => void;
  isNewlyUploaded: boolean;
  onMediaSelect: (url: string, type: 'image' | 'video' | 'raw', filename: string) => void;
  isSelectionMode: boolean;
  canDelete: boolean;
  canEditContact: boolean;
  canEditHome: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  showCheckbox?: boolean;
  onRequestFormatSelect?: (file: UnifiedFile) => void;
}) => {
  const { t } = useTranslation();

  const handleSelect = () => {
    if (onRequestFormatSelect && file.resourceType !== 'raw') {
      onRequestFormatSelect(file);
    } else {
      onMediaSelect(file.url, file.resourceType, file.filename);
    }
  };

  const fileName = file.filename || 'Untitled';

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
          {file.resourceType === 'image' ? (
            provider === 'cloudinary' ? (
              <Image src={file.url} alt={file.filename} fill className="object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={file.url} alt={file.filename} className="w-full h-full object-cover" />
            )
          ) : file.resourceType === 'video' ? (
            <div className="w-full h-full bg-black flex items-center justify-center">
              {provider === 'cloudinary' && (
                <Image src={file.url.replace(/\.(webm|m3u8)$/, '.jpg').replace(/\.mp4$/, '.jpg')} alt={file.filename} fill className="object-cover" />
              )}
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
              <FontAwesomeIcon icon={faFileImage} className="h-8 w-8 mb-2" />
              <p className="font-bold">{t('mediaAdmin.select')}</p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-1 md:gap-2">
              <Button size="icon" variant="ghost" onClick={() => onPreview(file)} title={t('mediaAdmin.preview')} className="h-8 w-8 md:h-10 md:w-10 text-white glass-effect">
                <FontAwesomeIcon icon={faEye} />
              </Button>
              {file.resourceType !== 'raw' && (
                <Button size="icon" variant="default" onClick={() => onMediaSelect(file.url, file.resourceType, file.filename)} title={t('mediaAdmin.createProject')} className="h-8 w-8 md:h-10 md:w-10 glass-effect">
                  <FontAwesomeIcon icon={faPlus} />
                </Button>
              )}
              {canEditHome && (
                <Button size="icon" variant="secondary" onClick={() => onSetBackground(file)} title={t('mediaAdmin.setAsBackground')} className="h-8 w-8 md:h-10 md:w-10 glass-effect">
                  <FontAwesomeIcon icon={faPhotoFilm} />
                </Button>
              )}
              {file.resourceType === 'image' && canEditContact && (
                <Button size="icon" variant="secondary" onClick={() => onSetLogo(file.url)} title="Set as Logo" className="h-8 w-8 md:h-10 md:w-10 glass-effect">
                  <FontAwesomeIcon icon={faStar} />
                </Button>
              )}
              {provider === 'cloudinary' ? (
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
                    {file.resourceType === 'video' ? (
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
                    ) : file.resourceType === 'image' ? (
                      <>
                        <DropdownMenuItem onClick={() => onCopy(formatVariant(file.url, 'webp'))}>WebP</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onCopy(formatVariant(file.url, 'avif'))}>AVIF</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onCopy(formatVariant(file.url, 'jpg'))}>JPG</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onCopy(formatVariant(file.url, 'png'))}>PNG</DropdownMenuItem>
                      </>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button size="icon" variant="ghost" onClick={() => onCopy(file.url)} title="Copy URL" className="h-8 w-8 md:h-10 md:w-10 text-white glass-effect">
                  <FontAwesomeIcon icon={faCopy} />
                </Button>
              )}
              {canDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="destructive" title={t('mediaAdmin.delete')} className="h-8 w-8 md:h-10 md:w-10">
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="w-[80vw] glass-effect">
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('mediaAdmin.confirmDelete')}</AlertDialogTitle>
                      <AlertDialogDescription>{t('mediaAdmin.confirmDeleteDescription')}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('mediaAdmin.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(file)}>
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
      <div className="px-1 min-w-0">
        <p className="text-xs text-center text-muted-foreground truncate" title={fileName}>{fileName}</p>
        {provider === 'vercel_blob' && file.size != null && (
          <p className="text-xs text-center text-muted-foreground truncate">{formatBytes(file.size)} • {file.contentType?.split('/')[1] || 'file'}</p>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default forwardRef<MediaLibraryRef, MediaLibraryProps>(function MediaLibrary(props, ref) {
  const { provider } = props;
  const { t } = useTranslation();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const auth = useAuth();
  const { startUpload: startGlobalUpload, updateProgress: updateGlobalProgress, finishUpload: finishGlobalUpload, isUploading: globalIsUploading, progress: globalProgress, fileName: globalFileName, provider: globalProvider, signalCompletedUpload, completedUpload, consumeCompletedUpload } = useUploadProgress();
  // Keep original names for Vercel upload flow which needs them
  const startUpload = startGlobalUpload;
  const finishUpload = finishGlobalUpload;

  // ---- Upload state ----
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const isProviderMatch = provider === 'cloudinary' ? 'cloudinary' : 'vercel';
  const effectiveIsUploading = isUploading || (globalIsUploading && globalProvider === isProviderMatch);
  const effectiveProgress = isUploading ? uploadProgress : (globalProvider === isProviderMatch ? globalProgress : 0);
  const effectiveFileName = isUploading ? uploadingFileName : (globalProvider === isProviderMatch ? globalFileName : '');

  // ---- Library state ----
  const [previewFile, setPreviewFile] = useState<UnifiedFile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isSetBackgroundOpen, setIsSetBackgroundOpen] = useState(false);
  const [backgroundTarget, setBackgroundTarget] = useState<'home' | 'website'>('home');
  const [backgroundFile, setBackgroundFile] = useState<UnifiedFile | null>(null);
  const [isAddFromUrlOpen, setIsAddFromUrlOpen] = useState(false);

  // Cloudinary-specific state
  const [isChoosingLibrary, setIsChoosingLibrary] = useState(false);
  const [isChoosingVideoFormat, setIsChoosingVideoFormat] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [uploadVideoFormat, setUploadVideoFormat] = useState<'mp4' | 'm3u8' | 'webm'>('mp4');
  const [formatChoiceAsset, setFormatChoiceAsset] = useState<UnifiedFile | null>(null);

  // Vercel-specific state
  const [addUrl, setAddUrl] = useState('');
  const [isAddingFromUrl, setIsAddingFromUrl] = useState(false);
  const [urlProgress, setUrlProgress] = useState(0);

  // Full library dialog (standalone mode)
  const [isFullLibraryOpen, setIsFullLibraryOpen] = useState(false);
  const [fullLibraryActiveTab, setFullLibraryActiveTab] = useState<'images' | 'videos' | 'files'>('images');
  const [fullLibraryActiveLibrary, setFullLibraryActiveLibrary] = useState<'primary' | 'extented'>('primary');
  const [localNewlyUploadedId, setLocalNewlyUploadedId] = useState<string | null>(null);

  // ---- Permissions (Cloudinary checks; Vercel implicitly allows all) ----
  const typedUser = user as AppUser | null;
  const isSuperAdmin = typedUser?.email === SUPERADMIN_EMAIL;
  const canUpload = provider === 'cloudinary' ? (isSuperAdmin || (typedUser?.permissions?.canUploadMedia ?? true)) : true;
  const canDelete = provider === 'cloudinary' ? (isSuperAdmin || (typedUser?.permissions?.canDeleteMedia ?? true)) : true;
  const canEditHome = provider === 'cloudinary' ? (isSuperAdmin || (typedUser?.permissions?.canEditHome ?? true)) : true;
  const canEditContact = provider === 'cloudinary' ? (isSuperAdmin || (typedUser?.permissions?.canEditContact ?? true)) : true;

  // ---- Dialog mode props ----
  const isDialog = !!(props as DialogMediaLibraryProps).isDialog;
  const dialogProps = isDialog ? (props as DialogMediaLibraryProps) : null;
  const activeTab = isDialog ? dialogProps!.activeTab : 'images';
  const setActiveTabFn = isDialog ? dialogProps!.setActiveTab : () => {};
  const activeLibrary = isDialog ? dialogProps!.activeLibrary : fullLibraryActiveLibrary;
  const setActiveLibraryFn = isDialog ? dialogProps!.setActiveLibrary : setFullLibraryActiveLibrary;
  const newlyUploadedId = isDialog ? dialogProps!.newlyUploadedId : localNewlyUploadedId;
  const showBulkSelect = canDelete && !(isDialog && dialogProps?.isSelectionMode);

  // ---- Ref: openFullLibrary ----
  useImperativeHandle(ref, () => ({
    openFullLibrary: (tab: 'images' | 'videos' | 'files', library: 'primary' | 'extented') => {
      setFullLibraryActiveTab(tab);
      setFullLibraryActiveLibrary(library);
      setIsFullLibraryOpen(true);
    },
  }));

  // ---- Vercel Blob: URL progress fake interval ----
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (isAddingFromUrl) {
      setUrlProgress(0);
      timer = setInterval(() => {
        setUrlProgress(prev => (prev >= 95 ? prev : prev + 5));
      }, 300);
    } else {
      setUrlProgress(0);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [isAddingFromUrl]);

  // ---- Auto-open full library after upload completes ----
  useEffect(() => {
    if (!completedUpload) return;
    if (provider === 'cloudinary' && completedUpload.libraryId === 'vercel_blob') return;
    if (provider === 'vercel_blob' && completedUpload.libraryId !== 'vercel_blob') return;
    const { docId, resourceType, libraryId } = completedUpload;
    const tab = resourceType === 'video' ? 'videos' : resourceType === 'raw' ? 'files' : 'images';
    if (provider === 'cloudinary') {
      setFullLibraryActiveTab(tab);
      setFullLibraryActiveLibrary((libraryId === 'primary' || libraryId === 'extented') ? libraryId : 'primary');
    } else {
      setFullLibraryActiveTab(tab);
    }
    setLocalNewlyUploadedId(docId);
    setIsFullLibraryOpen(true);
    const t1 = setTimeout(() => consumeCompletedUpload(), 3500);
    const t2 = setTimeout(() => setLocalNewlyUploadedId(null), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [completedUpload, consumeCompletedUpload, provider]);

  // ---- Listen for maximize button navigation from notification ----
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.provider !== provider) return;
      setFullLibraryActiveTab(detail.tab || 'images');
      if (provider === 'cloudinary' && detail.library) {
        setFullLibraryActiveLibrary(detail.library);
      }
      setLocalNewlyUploadedId(detail.docId || null);
      setIsFullLibraryOpen(true);
      if (detail.docId) {
        const timer = setTimeout(() => setLocalNewlyUploadedId(null), 3000);
        return () => clearTimeout(timer);
      }
    };
    window.addEventListener('media-library-maximize', handler);
    return () => window.removeEventListener('media-library-maximize', handler);
  }, [provider]);

  // ---- Firestore queries ----
  const cloudinaryColRef = useMemoFirebase(() => {
    if (!firestore || provider !== 'cloudinary') return null;
    return query(collection(firestore, 'media'), orderBy('created_at', 'desc'));
  }, [firestore, provider]);

  const vercelColRef = useMemoFirebase(() => {
    if (!firestore || provider !== 'vercel_blob') return null;
    return query(collection(firestore, 'vercel_blobs'), orderBy('uploadedAt', 'desc'));
  }, [firestore, provider]);

  const { data: cloudinaryAssets, isLoading: isLoadingCloudinary } = useCollection<MediaAsset>(cloudinaryColRef);
  const { data: vercelAssets, isLoading: isLoadingVercel } = useCollection<VercelBlobDoc>(vercelColRef as any);

  const isLoading = provider === 'cloudinary' ? isLoadingCloudinary : isLoadingVercel;

  // ---- Filter & categorize ----
  const { imageFiles, videoFiles, otherFiles } = useMemo(() => {
    const images: UnifiedFile[] = [];
    const videos: UnifiedFile[] = [];
    const others: UnifiedFile[] = [];
    const q = searchQuery.trim().toLowerCase();

    if (provider === 'cloudinary') {
      cloudinaryAssets?.forEach(asset => {
        const libraryMatch = asset.libraryId === activeLibrary || (activeLibrary === 'primary' && !asset.libraryId);
        const matchesSearch = !q || asset.filename?.toLowerCase().includes(q) || asset.title?.toLowerCase().includes(q);
        if (libraryMatch && matchesSearch) {
          const unified: UnifiedFile = {
            id: asset.id, url: asset.url, filename: asset.filename,
            resourceType: asset.resource_type, public_id: asset.public_id,
            libraryId: asset.libraryId, videoFormat: asset.videoFormat, _raw: asset,
          };
          if (asset.resource_type === 'image') images.push(unified);
          else if (asset.resource_type === 'video') videos.push(unified);
          else others.push(unified);
        }
      });
    } else {
      vercelAssets?.forEach(blob => {
        const matchesSearch = !q || blob.filename?.toLowerCase().includes(q) || blob.url.toLowerCase().includes(q);
        if (matchesSearch) {
          const isImage = blob.contentType?.startsWith('image/');
          const isVideo = blob.contentType?.startsWith('video/');
          const unified: UnifiedFile = {
            id: blob.id, url: blob.url, filename: blob.filename,
            resourceType: isImage ? 'image' : isVideo ? 'video' : 'raw',
            size: blob.size, contentType: blob.contentType, _raw: blob,
          };
          if (isImage) images.push(unified);
          else if (isVideo) videos.push(unified);
          else others.push(unified);
        }
      });
    }
    return { imageFiles: images, videoFiles: videos, otherFiles: others };
  }, [provider, cloudinaryAssets, vercelAssets, activeLibrary, searchQuery]);

  // ---- Vercel Blob: auth token ----
  const getToken = useCallback(async () => {
    const currentUser = auth?.currentUser;
    if (!currentUser) return null;
    try { return await currentUser.getIdToken(); } catch { return null; }
  }, [auth]);

  // ---- Upload: Vercel Blob file upload ----
  const handleVercelUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const token = await getToken();
    if (!token) { toast({ variant: 'destructive', title: 'Not authenticated', description: 'Please sign in again to upload.' }); return; }
    // Pre-flight: check server has BLOB_READ_WRITE_TOKEN before starting upload
    try {
      const probe = await fetch('/api/vercel-blob/handle-upload', { method: 'HEAD' });
      if (probe.status === 503) {
        toast({ variant: 'destructive', title: 'Vercel Blob not configured', description: 'BLOB_READ_WRITE_TOKEN is missing on the server.' });
        return;
      }
    } catch {}
    for (const file of files) {
      if (file.type.startsWith('image/') && file.size > 50 * 1024 * 1024) {
        toast({ variant: 'destructive', title: 'Image exceeds 50MB limit', description: file.name });
        continue;
      }
      setIsUploading(true);
      setUploadProgress(0);
      setUploadingFileName(file.name);
      startGlobalUpload(file.name, 'vercel');
      try {
        const UPLOAD_TIMEOUT_MS = 60_000;
        const blob: any = await Promise.race([
          upload(file.name, file, {
            access: 'public', handleUploadUrl: '/api/vercel-blob/handle-upload',
            headers: { Authorization: `Bearer ${token}` },
            onUploadProgress: ({ loaded, total }: { loaded: number; total: number }) => {
              const progress = Math.round((loaded / total) * 100);
              setUploadProgress(progress);
              updateGlobalProgress(progress, 'vercel');
            },
          } as any),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Upload timed out. The server may be unreachable.')), UPLOAD_TIMEOUT_MS)),
        ]);
        setUploadProgress(100);
        updateGlobalProgress(100, 'vercel');
        finishUpload('vercel');
        const lowerType = file.type.toLowerCase();
        const tab = lowerType.startsWith('image/') ? 'images' : lowerType.startsWith('video/') ? 'videos' : 'files';
        setActiveTabFn(tab);
        if (firestore) {
          try {
            const docRef = await addDocumentNonBlocking(collection(firestore, 'vercel_blobs'), {
              provider: 'vercel_blob', url: blob.url, pathname: blob.pathname,
              size: blob.size ?? file.size, contentType: blob.contentType || file.type || 'application/octet-stream',
              filename: file.name, uploadedAt: serverTimestamp(), uploadedBy: auth?.currentUser?.uid || null,
            } as any);
            const newId = (docRef as any)?.id || blob.pathname;
            const resourceType = file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'image' : 'raw';
            if (newId && props.onUploadComplete) props.onUploadComplete(newId, resourceType);
            if (newId) { setLocalNewlyUploadedId(newId); setTimeout(() => setLocalNewlyUploadedId(null), 3000); }
            if (newId) signalCompletedUpload(newId, resourceType, 'vercel_blob');
          } catch (e) { console.error('MediaLibrary: Firestore add after Vercel upload failed', e); }
        }
      } catch (e: any) {
        finishUpload('vercel');
        toast({ variant: 'destructive', title: 'Upload failed', description: e?.message || String(e) });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadingFileName('');
        setTimeout(() => finishUpload(), 1000);
      }
    }
  }, [getToken, toast, firestore, auth, finishUpload, startGlobalUpload, updateGlobalProgress, props.onUploadComplete, setActiveTabFn, signalCompletedUpload]);

  // ---- Upload: Vercel Blob add-from-url ----
  const handleVercelAddFromUrl = async () => {
    if (!addUrl.trim()) return;
    const token = await getToken();
    if (!token) { toast({ variant: 'destructive', title: 'Not authenticated' }); return; }
    const filename = addUrl.split('/').pop() || 'file';
    setIsAddingFromUrl(true);
    startUpload(filename, 'vercel');
    let prog = 5;
    const interval = setInterval(() => {
      prog = Math.min(95, prog + Math.random() * 1 + 0.2);
      setUrlProgress(prog);
      updateGlobalProgress(prog, 'vercel');
    }, 600);
    try {
      const res = await fetch('/api/vercel-blob/add-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url: addUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Add from URL failed');
      clearInterval(interval);
      setUrlProgress(100);
      updateGlobalProgress(100, 'vercel');
      if (firestore) {
        try {
          const docRef = await addDocumentNonBlocking(collection(firestore, 'vercel_blobs'), {
            provider: 'vercel_blob', url: data.url,
            pathname: data.pathname || `vercel-blob/${Date.now()}-${addUrl.split('/').pop() || 'file'}`,
            size: data.size ?? 0, contentType: data.contentType || 'application/octet-stream',
            filename: data.filename || data.url.split('/').pop() || addUrl.split('/').pop() || 'file',
            uploadedAt: serverTimestamp(), uploadedBy: auth?.currentUser?.uid || null,
            sourceUrl: addUrl.trim(),
          } as any);
          const newId = (docRef as any)?.id;
          if (newId) {
            setLocalNewlyUploadedId(newId);
            setTimeout(() => setLocalNewlyUploadedId(null), 3000);
            const ct = (data.contentType || '').toLowerCase();
            signalCompletedUpload(newId, ct.startsWith('image/') ? 'image' : ct.startsWith('video/') ? 'video' : 'raw', 'vercel_blob');
          }
        } catch (e) { console.error('MediaLibrary: Firestore add from URL failed', e); }
      }
      const ct = (data.contentType || '').toLowerCase();
      const tab = ct.startsWith('image/') ? 'images' : ct.startsWith('video/') ? 'videos' : 'files';
      setActiveTabFn(tab);
      finishUpload('vercel');
      setIsAddFromUrlOpen(false);
      setAddUrl('');
    } catch (e: any) {
      clearInterval(interval);
      finishUpload('vercel');
      toast({ variant: 'destructive', title: 'Add from URL failed', description: e?.message });
    } finally { setIsAddingFromUrl(false); }
  };

  // ---- Upload: Cloudinary file drop ----
  const onCloudinaryDrop = useCallback((acceptedFiles: File[]) => {
    if (!canUpload) { toast({ variant: 'destructive', title: t('mediaAdmin.toast.permissionDenied.title'), description: t('mediaAdmin.toast.permissionDenied.description') }); return; }
    setFilesToUpload(acceptedFiles);
    if (acceptedFiles.some(f => f.type.startsWith('video/'))) {
      setUploadVideoFormat('mp4');
    } else {
      setUploadVideoFormat('mp4');
    }
    setIsChoosingLibrary(true);
  }, [canUpload, toast, t]);

  const handleCloudinaryLibraryChoiceAndUpload = useCallback(async (libraryId: 'primary' | 'extented') => {
    setIsChoosingLibrary(false);
    let cloudName: string | undefined, uploadPreset: string | undefined;
    if (libraryId === 'primary') {
      cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_1;
      uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_1;
    } else {
      cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_2;
      uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_2;
    }
    if (!cloudName || !uploadPreset || uploadPreset.includes("your_unsigned_preset")) {
      toast({ variant: 'destructive', title: t('mediaAdmin.toast.configError.title'), description: t('mediaAdmin.toast.configError.description').replace('{library}', libraryId === 'primary' ? 'Library Primary' : 'Library Extented'), duration: 10000 });
      setFilesToUpload([]);
      return;
    }
    setIsUploading(true);
    if (filesToUpload.length > 0) startGlobalUpload(filesToUpload[0].name, 'cloudinary');
    for (const file of filesToUpload) {
      setUploadingFileName(file.name);
      setUploadProgress(0);
      updateGlobalProgress(0, 'cloudinary');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, true);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
          updateGlobalProgress(progress, 'cloudinary');
          if (progress >= 100) finishGlobalUpload('cloudinary');
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
          if (firestore) {
            const mediaData = {
              public_id: response.public_id, url: finalUrl, resource_type: response.resource_type,
              created_at: response.created_at, filename: file.name, libraryId: libraryId,
              ...(response.resource_type === 'video' && { videoFormat: uploadVideoFormat }),
            };
            const docRefPromise = addDocumentNonBlocking(collection(firestore, 'media'), mediaData);
            const docRef = await docRefPromise as DocumentReference | undefined;
            if (docRef && !isDialog && props.onUploadComplete) props.onUploadComplete(docRef.id, response.resource_type, libraryId);
            if (docRef) signalCompletedUpload(docRef.id, response.resource_type, libraryId);
          }
        } else {
          const error = JSON.parse(xhr.responseText).error;
          toast({ variant: 'destructive', title: t('mediaAdmin.toast.uploadFailed.title').replace('{file}', file.name), description: t('mediaAdmin.toast.uploadFailed.description').replace('{error}', error.message || 'Unknown error') });
        }
      };
      xhr.onerror = () => { toast({ variant: 'destructive', title: t('mediaAdmin.toast.uploadFailedNetwork.title').replace('{file}', file.name), description: t('mediaAdmin.toast.uploadFailedNetwork.description') }); };
      xhr.send(formData);
      await new Promise(resolve => { xhr.onloadend = () => resolve(undefined); });
    }
    setIsUploading(false);
    setUploadingFileName('');
    setUploadProgress(0);
    setFilesToUpload([]);
  }, [filesToUpload, toast, firestore, props.onUploadComplete, isDialog, uploadVideoFormat, t, startGlobalUpload, updateGlobalProgress, finishGlobalUpload, signalCompletedUpload, canUpload]);

  // ---- Dropzone ----
  const onDrop = provider === 'cloudinary' ? onCloudinaryDrop : (accepted: File[]) => handleVercelUpload(accepted);

  const dropzoneAccept = provider === 'cloudinary' ? {
    'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg'],
    'video/*': ['.mp4', '.mov', '.webm'],
    'text/vtt': ['.vtt'],
    'application/json': ['.json'],
  } : undefined;

  const { getRootProps: getRootPropsMain, getInputProps: getInputPropsMain, isDragActive: isDragActiveMain } = useDropzone({
    onDrop, accept: dropzoneAccept, disabled: !canUpload || effectiveIsUploading, multiple: true,
  });
  const { getRootProps: getRootPropsDialog, getInputProps: getInputPropsDialog, isDragActive: isDragActiveDialog } = useDropzone({
    onDrop, accept: dropzoneAccept, disabled: !canUpload || effectiveIsUploading, multiple: true,
  });

  // ---- Delete: Cloudinary ----
  const handleCloudinaryDelete = async (file: UnifiedFile) => {
    if (!firestore || !canDelete) return;
    const raw = file._raw as MediaAsset;
    const token = await getToken();
    if (!token) { toast({ variant: 'destructive', title: 'Not authenticated' }); return; }
    try {
      const result = await deleteMediaAsset({
        publicId: raw.public_id,
        resourceType: (['image', 'video', 'raw'].includes(raw.resource_type) ? raw.resource_type : 'image') as 'image' | 'video' | 'raw',
        libraryId: raw.libraryId || 'primary',
        idToken: token,
      });
      await deleteDocumentNonBlocking(doc(firestore, 'media', file.id));
      if (result.success) {
        toast({ title: t('mediaAdmin.toast.fileRemoved.title'), description: t('mediaAdmin.toast.fileRemoved.description') });
      } else {
        toast({ variant: 'destructive', title: t('mediaAdmin.toast.cloudinaryCleanupFailed.title'), description: t('mediaAdmin.toast.cloudinaryCleanupFailed.description').replace('{error}', result.message) });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: t('mediaAdmin.toast.deletionFailed.title'), description: t('mediaAdmin.toast.deletionFailed.description').replace('{error}', e.message) });
    }
  };

  // ---- Delete: Vercel Blob ----
  const handleVercelDelete = async (file: UnifiedFile) => {
    const token = await getToken();
    if (!token) { toast({ variant: 'destructive', title: 'Not authenticated' }); return; }
    try {
      const res = await fetch('/api/vercel-blob/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url: file.url }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Delete failed');
      if (firestore) {
        try { await deleteDocumentNonBlocking(doc(firestore, 'vercel_blobs', file.id)); } catch (e) { console.error('MediaLibrary: Firestore delete after Vercel delete failed', e); }
      }
      toast({ title: 'Deleted' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Delete failed', description: e?.message });
    }
  };

  const handleDelete = provider === 'cloudinary' ? handleCloudinaryDelete : handleVercelDelete;

  // ---- Set Logo ----
  const handleSetLogo = (url: string) => {
    if (!firestore || !canEditContact) return;
    setDocumentNonBlocking(doc(firestore, 'homepage', 'settings'), { homePageLogoUrl: url }, { merge: true });
    toast({ title: t('mediaAdmin.toast.logoUpdated.title'), description: t('mediaAdmin.toast.logoUpdated.description') });
  };

  // ---- Copy URL ----
  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: t('mediaAdmin.toast.copied.title'), description: t('mediaAdmin.toast.copied.description') });
  };

  // ---- Set Background ----
  const handleOpenSetBackgroundDialog = (file: UnifiedFile) => {
    if (!canEditHome) return;
    setBackgroundFile(file);
    setIsSetBackgroundOpen(true);
  };

  const handleConfirmSetBackground = async () => {
    if (!firestore || !backgroundFile || !canEditHome) return;
    let mediaIdForDb = backgroundFile.id;
    const mediaTypeForDb = backgroundFile.resourceType === 'video' ? 'video' : 'image';
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
          title, description: "Automatically created for background video.", type: 'video',
          sourceUrl: backgroundFile.url, thumbnailUrl: backgroundFile.url.replace(/\.(mp4|m3u8|webm)$/, '.jpg'),
          isVisible: false, order: 999,
        });
        await batch.commit();
        toast({ title: t('mediaAdmin.toast.projectCreated.title'), description: t('mediaAdmin.toast.projectCreated.description') });
      }
    }
    const settingsDocRef = doc(firestore, 'homepage', 'settings');
    const fieldToUpdateId = backgroundTarget === 'home' ? 'homePageBackgroundMediaId' : 'websiteBackgroundMediaId';
    const fieldToUpdateType = backgroundTarget === 'home' ? 'homePageBackgroundType' : 'websiteBackgroundType';
    const fieldToUpdateUrl = backgroundTarget === 'home' ? 'homePageBackgroundUrl' : 'websiteBackgroundUrl';
    setDocumentNonBlocking(settingsDocRef, {
      [fieldToUpdateId]: mediaIdForDb, [fieldToUpdateType]: mediaTypeForDb, [fieldToUpdateUrl]: backgroundFile.url,
    }, { merge: true });
    toast({ title: t('mediaAdmin.toast.backgroundUpdated.title'), description: t('mediaAdmin.toast.backgroundUpdated.description').replace('{page}', backgroundTarget === 'home' ? 'Homepage' : 'Other Pages') });
    setIsSetBackgroundOpen(false);
  };

  // ---- Media select (dialog mode) ----
  const handleMediaSelect = (url: string, type: 'image' | 'video' | 'raw', filename: string) => {
    if (isDialog) {
      dialogProps!.onMediaSelect(url, type, filename);
      dialogProps!.onSelectionComplete();
    } else if (props.onMediaSelect) {
      props.onMediaSelect(url, type, filename);
    }
  };

  const handleConfirmFormatPick = (url: string) => {
    if (!formatChoiceAsset) return;
    handleMediaSelect(url, formatChoiceAsset.resourceType, formatChoiceAsset.filename);
    setFormatChoiceAsset(null);
  };

  // ---- Bulk select ----
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  // ---- Bulk delete: Cloudinary ----
  const handleCloudinaryBulkDelete = async () => {
    if (!firestore || !canDelete) return;
    const token = await getToken();
    if (!token) { toast({ variant: 'destructive', title: 'Not authenticated' }); return; }
    const results = await Promise.allSettled(
      (cloudinaryAssets || []).filter(a => selectedIds.has(a.id)).map(a => deleteMediaAsset({
        publicId: a.public_id,
        resourceType: (['image', 'video', 'raw'].includes(a.resource_type) ? a.resource_type : 'image') as 'image' | 'video' | 'raw',
        libraryId: a.libraryId || 'primary',
        idToken: token,
      }))
    );
    const failedCount = results.filter(r => r.status === 'rejected' || !(r as any).value.success).length;
    const batch = writeBatch(firestore);
    selectedIds.forEach(id => { batch.delete(doc(firestore, 'media', id)); });
    await batch.commit();
    if (failedCount > 0) {
      toast({ variant: 'destructive', title: t('mediaAdmin.toast.cloudinaryCleanupFailed.title'), description: t('mediaAdmin.toast.cloudinaryCleanupFailed.bulk').replace('{count}', String(failedCount)) });
    } else {
      toast({ title: t('mediaAdmin.toast.fileRemoved.title'), description: `Deleted ${selectedIds.size} files.` });
    }
    setSelectedIds(new Set());
    setIsBulkDeleteOpen(false);
  };

  // ---- Bulk delete: Vercel ----
  const handleVercelBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const token = await getToken();
    if (!token) { toast({ variant: 'destructive', title: 'Not authenticated' }); return; }
    const ids = Array.from(selectedIds);
    const blobsToDelete = (vercelAssets || []).filter(b => ids.includes(b.id));
    let failed = 0;
    for (const b of blobsToDelete) {
      try {
        const res = await fetch('/api/vercel-blob/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ url: b.url }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Delete failed');
        try { await deleteDocumentNonBlocking(doc(firestore!, 'vercel_blobs', b.id)); } catch (e) { console.error('MediaLibrary: Firestore delete in bulk failed', e); }
      } catch (e) {
        failed++;
        try { await deleteDocumentNonBlocking(doc(firestore!, 'vercel_blobs', b.id)); } catch (e) { console.error('MediaLibrary: Firestore delete in bulk failed', e); }
      }
    }
    if (failed > 0) toast({ variant: 'destructive', title: `Deleted ${ids.length - failed}/${ids.length}`, description: `${failed} failed` });
    else toast({ title: 'Deleted', description: `Deleted ${ids.length} files` });
    setSelectedIds(new Set());
    setIsBulkDeleteOpen(false);
  };

  const handleBulkDelete = provider === 'cloudinary' ? handleCloudinaryBulkDelete : handleVercelBulkDelete;

  // ---- URL upload complete callback (Cloudinary AddFromUrlDialog) ----
  const handleCloudinaryUrlUploadComplete = (mediaId: string, resourceType: 'image' | 'video' | 'raw', libraryId: 'primary' | 'extented') => {
    if (!isDialog && props.onUploadComplete) props.onUploadComplete(mediaId, resourceType, libraryId);
    signalCompletedUpload(mediaId, resourceType, libraryId);
  };

  // ---- Render: library grid ----
  const renderLibrary = (assets: UnifiedFile[], type: 'image' | 'video' | 'raw') => {
    if (isLoading) {
      return <div className="flex justify-center items-center h-full min-h-[200px]"><Preloader /></div>;
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
          <FileCard
            key={file.id} file={file} provider={provider}
            onDelete={handleDelete} onCopy={handleCopy} onPreview={setPreviewFile}
            onSetLogo={handleSetLogo} onSetBackground={handleOpenSetBackgroundDialog}
            isNewlyUploaded={file.id === newlyUploadedId}
            onMediaSelect={handleMediaSelect}
            onRequestFormatSelect={provider === 'cloudinary' ? (f) => setFormatChoiceAsset(f) : undefined}
            isSelectionMode={!!(isDialog && dialogProps?.isSelectionMode)}
            canDelete={canDelete} canEditContact={canEditContact} canEditHome={canEditHome}
            isSelected={selectedIds.has(file.id)} onToggleSelect={handleToggleSelect} showCheckbox={showBulkSelect}
          />
        ))}
      </div>
    );
  };

  // ---- Render: preview content ----
  const renderPreviewContent = () => {
    if (!previewFile) return null;
    if (previewFile.resourceType === 'image') {
      return provider === 'cloudinary' ? (
        <div className="relative w-full h-full"><Image src={previewFile.url} alt={previewFile.filename} fill className="object-contain" /></div>
      ) : (
        <div className="relative w-full h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewFile.url} alt={previewFile.filename} className="w-full h-full object-contain" />
        </div>
      );
    }
    if (previewFile.resourceType === 'video' && previewFile.url) {
      return <div className="w-full h-full flex items-center justify-center bg-black"><CdnClapprPlayer source={previewFile.url} /></div>;
    }
    return provider === 'vercel_blob' ? (
      <div className="text-center text-white/70">
        <FontAwesomeIcon icon={faFileLines} className="h-12 w-12 mb-2" />
        <p className="text-sm">{previewFile.filename}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => handleCopy(previewFile.url)}>Copy URL</Button>
      </div>
    ) : null;
  };

  // ---- Dialog close button ----
  const dialogCloseBtn = (
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
  );

  // ---- Upload flow dialogs (Cloudinary) ----
  const cloudinaryUploadFlowDialogs = provider === 'cloudinary' ? (
    <>
      <Dialog open={isChoosingLibrary} onOpenChange={setIsChoosingLibrary}>
        <DialogContent className="w-[80vw] glass-effect">
          <DialogHeader>
            <DialogTitle>{t('mediaAdmin.chooseUploadSettings')}</DialogTitle>
            <DialogDescription>{t('mediaAdmin.chooseUploadSettingsDescription')}</DialogDescription>
          </DialogHeader>
          {filesToUpload.some(f => f.type.startsWith('video/')) && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('mediaAdmin.chooseVideoFormat')}</p>
              <RadioGroup defaultValue="mp4" onValueChange={(value: 'mp4' | 'm3u8' | 'webm') => setUploadVideoFormat(value)}>
                <div className="flex items-center space-x-2"><RadioGroupItem value="mp4" id="r1" /><Label htmlFor="r1">{t('mediaAdmin.mp4')}</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="m3u8" id="r2" /><Label htmlFor="r2">{t('mediaAdmin.m3u8')}</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="webm" id="r3" /><Label htmlFor="r3">{t('mediaAdmin.webm')}</Label></div>
              </RadioGroup>
            </div>
          )}
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('mediaAdmin.chooseLibrary')}</p>
            <div className="flex justify-center gap-4 py-2">
              <Button onClick={() => handleCloudinaryLibraryChoiceAndUpload('primary')} size="lg" className="w-48"><FontAwesomeIcon icon={faUniversity} className="mr-2" /> {t('mediaAdmin.libraryPrimary')}</Button>
              <Button onClick={() => handleCloudinaryLibraryChoiceAndUpload('extented')} size="lg" className="w-48"><FontAwesomeIcon icon={faUniversity} className="mr-2" /> {t('mediaAdmin.libraryExtented')}</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsChoosingLibrary(false)}>{t('mediaAdmin.cancel')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  ) : null;

  // ---- Upload strip (shared) ----
  const uploadStrip = (
    <div className="flex flex-col gap-4">
      <div
        {...getRootPropsMain()}
        className={cn(
          'flex-1 border-2 border-dashed rounded-lg p-6 text-center transition-colors relative cursor-pointer',
          isDragActiveMain && canUpload ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50',
          (!canUpload || effectiveIsUploading) && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputPropsMain()} disabled={!canUpload || effectiveIsUploading} />
        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <FontAwesomeIcon icon={faCloudUploadAlt} className="h-8 w-8" />
          {effectiveIsUploading ? (
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
  );

  // ---- Upload strip inside dialog ----
  const dialogUploadStrip = (
    <div className="px-4 pt-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div
          {...getRootPropsDialog()}
          className={cn(
            'flex-1 border border-dashed rounded-md px-3 py-2 flex items-center justify-center gap-2 cursor-pointer transition-colors text-muted-foreground min-w-0',
            isDragActiveDialog && canUpload ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50',
            (!canUpload || effectiveIsUploading) && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input {...getInputPropsDialog()} disabled={!canUpload || effectiveIsUploading} />
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
  );

  // ---- Content tabs (shared) ----
  const contentTabs = (searchBar: React.ReactNode, uploadArea: React.ReactNode) => (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTabFn(value as any)} className="flex-1 flex flex-col min-h-0">
      <div className='px-4 pt-4 flex items-center gap-2 flex-wrap'>
        <TabsList>
          <TabsTrigger value="images" className="py-2 px-4 text-base glass-effect data-[state=active]:bg-destructive">
            <FontAwesomeIcon icon={faFileImage} className="mr-2" />{t('mediaAdmin.tab.images')}
          </TabsTrigger>
          <TabsTrigger value="videos" className="py-2 px-4 text-base glass-effect data-[state=active]:bg-destructive">
            <FontAwesomeIcon icon={faFilm} className="mr-2" />{t('mediaAdmin.tab.videos')}
          </TabsTrigger>
          <TabsTrigger value="files" className="py-2 px-4 text-base glass-effect data-[state=active]:bg-destructive">
            <FontAwesomeIcon icon={faFileLines} className="mr-2" />{t('mediaAdmin.tab.files')}
          </TabsTrigger>
        </TabsList>
        {searchBar}
      </div>
      {uploadArea}
      <ScrollArea className="flex-1">
        <TabsContent value="images" className="p-4 m-0">{renderLibrary(imageFiles, 'image')}</TabsContent>
        <TabsContent value="videos" className="p-4 m-0">{renderLibrary(videoFiles, 'video')}</TabsContent>
        <TabsContent value="files" className="p-4 m-0">{renderLibrary(otherFiles, 'raw')}</TabsContent>
      </ScrollArea>
      {showBulkSelect && (
        <BulkActionBar selectedCount={selectedIds.size} onClearSelection={() => setSelectedIds(new Set())} onDelete={() => setIsBulkDeleteOpen(true)} className="!relative !bottom-auto !left-auto !translate-x-0 mx-4 mb-4" />
      )}
    </Tabs>
  );

  // ---- Library tabs (Cloudinary only) ----
  const libraryTabs = provider === 'cloudinary' ? (
    <Tabs value={activeLibrary} onValueChange={(value) => setActiveLibraryFn(value as 'primary' | 'extented')} className='px-4 pt-4'>
      <TabsList>
        <TabsTrigger value="primary" className="py-2 px-4 text-base glass-effect data-[state=active]:bg-destructive">{t('mediaAdmin.tab.libraryPrimary')}</TabsTrigger>
        <TabsTrigger value="extented" className="py-2 px-4 text-base glass-effect data-[state=active]:bg-destructive">{t('mediaAdmin.tab.libraryExtented')}</TabsTrigger>
      </TabsList>
    </Tabs>
  ) : null;

  const searchBar = (
    <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('mediaAdmin.searchPlaceholder')} className="max-w-[220px] md:max-w-xs ml-auto glass-effect" />
  );

  // ---- Dialog mode content ----
  const dialogContent = (
    <>
      <DialogHeader className="p-4 border-b text-center">
        <DialogTitle className="font-headline">{isDialog && dialogProps?.isSelectionMode ? t('mediaAdmin.chooseMedia') : t('mediaAdmin.mediaLibrary')}</DialogTitle>
        <DialogDescription>{t('mediaAdmin.description')}</DialogDescription>
      </DialogHeader>
      {libraryTabs}
      {contentTabs(searchBar, dialogUploadStrip)}
      {dialogCloseBtn}
    </>
  );

  // ---- Shared dialogs (both modes) ----
  const previewDialog = (
    <Dialog open={!!previewFile} onOpenChange={(isOpen) => !isOpen && setPreviewFile(null)}>
      <DialogContent className="w-[80vw] h-[90vh] glass-effect p-0 flex flex-col items-center justify-center bg-black/80 border-0">
        <DialogHeader className="absolute top-4 left-4 z-10">
          <DialogTitle className="text-white/80 font-headline">{previewFile?.filename}</DialogTitle>
        </DialogHeader>
        {renderPreviewContent()}
        <DialogClose className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:opacity-100 transition-opacity">
          <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          <span className="sr-only">{t('mediaAdmin.close')}</span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );

  const setBackgroundDialog = (
    <Dialog open={isSetBackgroundOpen} onOpenChange={setIsSetBackgroundOpen}>
      <DialogContent className="w-[80vw] glass-effect">
        <DialogHeader>
          <DialogTitle>{t('mediaAdmin.setAsBackground')}</DialogTitle>
          <DialogDescription>{t('mediaAdmin.setAsBackgroundDescription')}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup defaultValue="home" value={backgroundTarget} onValueChange={(value: 'home' | 'website') => setBackgroundTarget(value)}>
            <div className="flex items-center space-x-2"><RadioGroupItem value="home" id="bg-home" /><Label htmlFor="bg-home">{t('mediaAdmin.homepageOnly')}</Label></div>
            <div className="flex items-center space-x-2"><RadioGroupItem value="website" id="bg-website" /><Label htmlFor="bg-website">{t('mediaAdmin.otherPages')}</Label></div>
          </RadioGroup>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsSetBackgroundOpen(false)}>{t('mediaAdmin.cancel')}</Button>
          <Button onClick={handleConfirmSetBackground}>{t('mediaAdmin.confirm')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const bulkDeleteDialog = (
    <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
      <AlertDialogContent className="w-[80vw] glass-effect">
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
  );

  // ---- Dialog mode ----
  if (isDialog) {
    return (
      <>
        <Dialog open={dialogProps!.isOpen} onOpenChange={dialogProps!.onOpenChange}>
          <DialogContent className="w-[80vw] h-[90vh] glass-effect p-0 flex flex-col">
            {dialogContent}
          </DialogContent>
        </Dialog>
        {provider === 'cloudinary' && <AddFromUrlDialog isOpen={isAddFromUrlOpen} onOpenChange={setIsAddFromUrlOpen} onUploadComplete={handleCloudinaryUrlUploadComplete} />}
        {previewDialog}
        {setBackgroundDialog}
        {cloudinaryUploadFlowDialogs}
        {bulkDeleteDialog}
        {/* Format choice dialog for media selection */}
        <Dialog open={!!formatChoiceAsset} onOpenChange={(open) => { if (!open) setFormatChoiceAsset(null); }}>
          <DialogContent className="w-[80vw] glass-effect">
            <DialogHeader>
              <DialogTitle>{t('mediaAdmin.chooseFormat')}</DialogTitle>
              <DialogDescription>{t('mediaAdmin.chooseFormatDescription')}</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              {formatChoiceAsset?.resourceType === 'video' ? (
                <div className="flex flex-col gap-2">
                  <Button onClick={() => { if (formatChoiceAsset) { handleConfirmFormatPick(formatVariant(formatChoiceAsset.url, 'mp4')); } }} variant="outline" className="justify-start">
                    <FontAwesomeIcon icon={faFilm} className="mr-2 h-4 w-4" /> MP4
                  </Button>
                  <Button onClick={() => { if (formatChoiceAsset) { handleConfirmFormatPick(formatVariant(formatChoiceAsset.url, 'webm')); } }} variant="outline" className="justify-start">
                    <FontAwesomeIcon icon={faFilm} className="mr-2 h-4 w-4" /> WebM
                  </Button>
                  <Button onClick={() => { if (formatChoiceAsset) { handleConfirmFormatPick(hlsVariant(formatChoiceAsset.url)); } }} variant="outline" className="justify-start">
                    <FontAwesomeIcon icon={faFilm} className="mr-2 h-4 w-4" /> HLS (m3u8)
                  </Button>
                  <Button onClick={() => { if (formatChoiceAsset) { handleConfirmFormatPick(formatChoiceAsset.url); } }} variant="ghost" className="justify-start text-muted-foreground">
                    {t('mediaAdmin.copy.default')}
                  </Button>
                </div>
              ) : formatChoiceAsset?.resourceType === 'image' && provider === 'cloudinary' ? (
                <div className="flex flex-col gap-2">
                  <Button onClick={() => { if (formatChoiceAsset) { handleConfirmFormatPick(formatVariant(formatChoiceAsset.url, 'webp')); } }} variant="outline" className="justify-start">
                    <FontAwesomeIcon icon={faFileImage} className="mr-2 h-4 w-4" /> WebP
                  </Button>
                  <Button onClick={() => { if (formatChoiceAsset) { handleConfirmFormatPick(formatVariant(formatChoiceAsset.url, 'avif')); } }} variant="outline" className="justify-start">
                    <FontAwesomeIcon icon={faFileImage} className="mr-2 h-4 w-4" /> AVIF
                  </Button>
                  <Button onClick={() => { if (formatChoiceAsset) { handleConfirmFormatPick(formatVariant(formatChoiceAsset.url, 'jpg')); } }} variant="outline" className="justify-start">
                    <FontAwesomeIcon icon={faFileImage} className="mr-2 h-4 w-4" /> JPG
                  </Button>
                  <Button onClick={() => { if (formatChoiceAsset) { handleConfirmFormatPick(formatVariant(formatChoiceAsset.url, 'png')); } }} variant="outline" className="justify-start">
                    <FontAwesomeIcon icon={faFileImage} className="mr-2 h-4 w-4" /> PNG
                  </Button>
                  <Button onClick={() => { if (formatChoiceAsset) { handleConfirmFormatPick(formatChoiceAsset.url); } }} variant="ghost" className="justify-start text-muted-foreground">
                    {t('mediaAdmin.copy.default')}
                  </Button>
                </div>
              ) : (
                <Button onClick={() => { if (formatChoiceAsset) { handleConfirmFormatPick(formatChoiceAsset.url); } }} className="w-full">
                  <FontAwesomeIcon icon={faFileImage} className="mr-2 h-4 w-4" /> {t('mediaAdmin.select')}
                </Button>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFormatChoiceAsset(null)}>{t('adminMgmt.cancel')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // ---- Vercel: add-from-url dialog ----
  const vercelAddFromUrlDialog = provider === 'vercel_blob' ? (
    <Dialog open={isAddFromUrlOpen} onOpenChange={setIsAddFromUrlOpen}>
      <DialogContent className="sm:max-w-md glass-effect">
        <DialogHeader>
          <DialogTitle>{t('mediaAdmin.addFromUrl')}</DialogTitle>
          <p className="text-sm text-muted-foreground">Paste a direct URL and it will be fetched and stored in Vercel Blob.</p>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <Input placeholder="https://example.com/file.mp4" value={addUrl} onChange={(e) => setAddUrl(e.target.value)} disabled={isAddingFromUrl} />
          {isAddingFromUrl && (
            <div className="space-y-2 text-center">
              <p className="text-sm text-muted-foreground">Please wait, adding to library...</p>
              <Progress value={urlProgress} />
              <p className="text-xs text-muted-foreground">{Math.round(urlProgress)}%</p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddFromUrlOpen(false)}>
              {isAddingFromUrl ? 'Minimize' : 'Cancel'}
            </Button>
            <Button onClick={handleVercelAddFromUrl} disabled={!addUrl.trim() || isAddingFromUrl}>
              {isAddingFromUrl && <FontAwesomeIcon icon={faSpinner} className="mr-2 h-4 w-4 animate-spin" />}
              {isAddingFromUrl ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </div>
        {isAddingFromUrl && (
          <DialogClose className="absolute right-4 top-4 h-8 w-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground opacity-70 hover:opacity-100 transition-opacity">
            <FontAwesomeIcon icon={faMinus} className="h-4 w-4" />
            <span className="sr-only">Minimize</span>
          </DialogClose>
        )}
      </DialogContent>
    </Dialog>
  ) : null;

  // ---- Full library dialog (standalone mode) ----
  const fullLibraryDialog = (
    <Dialog open={isFullLibraryOpen} onOpenChange={setIsFullLibraryOpen}>
      <DialogContent className={cn("glass-effect p-0 flex flex-col", provider === 'vercel_blob' ? "w-[90vw] max-w-6xl h-[85vh]" : "w-[80vw] h-[90vh]")}>
        <DialogHeader className="p-4 border-b text-center">
          <DialogTitle className="font-headline">{t('mediaAdmin.mediaLibrary')}</DialogTitle>
          <DialogDescription>{t('mediaAdmin.description')}</DialogDescription>
        </DialogHeader>
        {provider === 'cloudinary' && (
          <Tabs value={fullLibraryActiveLibrary} onValueChange={(value) => setFullLibraryActiveLibrary(value as 'primary' | 'extented')} className='px-4 pt-4'>
            <TabsList>
              <TabsTrigger value="primary" className="py-2 px-4 text-base glass-effect data-[state=active]:bg-destructive">{t('mediaAdmin.tab.libraryPrimary')}</TabsTrigger>
              <TabsTrigger value="extented" className="py-2 px-4 text-base glass-effect data-[state=active]:bg-destructive">{t('mediaAdmin.tab.libraryExtented')}</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        <Tabs value={fullLibraryActiveTab} onValueChange={(value) => setFullLibraryActiveTab(value as any)} className="flex-1 flex flex-col min-h-0">
          <div className='px-4 pt-4 flex items-center gap-2 flex-wrap'>
            <TabsList>
              <TabsTrigger value="images" className="py-2 px-4 text-base glass-effect data-[state=active]:bg-destructive">
                <FontAwesomeIcon icon={faFileImage} className="mr-2" />{t('mediaAdmin.tab.images')}
              </TabsTrigger>
              <TabsTrigger value="videos" className="py-2 px-4 text-base glass-effect data-[state=active]:bg-destructive">
                <FontAwesomeIcon icon={faFilm} className="mr-2" />{t('mediaAdmin.tab.videos')}
              </TabsTrigger>
              <TabsTrigger value="files" className="py-2 px-4 text-base glass-effect data-[state=active]:bg-destructive">
                <FontAwesomeIcon icon={faFileLines} className="mr-2" />{t('mediaAdmin.tab.files')}
              </TabsTrigger>
            </TabsList>
            {searchBar}
          </div>
          {dialogUploadStrip}
          <ScrollArea className="flex-1">
            <TabsContent value="images" className="p-4 m-0">{renderLibrary(imageFiles, 'image')}</TabsContent>
            <TabsContent value="videos" className="p-4 m-0">{renderLibrary(videoFiles, 'video')}</TabsContent>
            <TabsContent value="files" className="p-4 m-0">{renderLibrary(otherFiles, 'raw')}</TabsContent>
          </ScrollArea>
          {showBulkSelect && (
            <BulkActionBar selectedCount={selectedIds.size} onClearSelection={() => setSelectedIds(new Set())} onDelete={() => setIsBulkDeleteOpen(true)} className="!relative !bottom-auto !left-auto !translate-x-0 mx-4 mb-4" />
          )}
        </Tabs>
        {dialogCloseBtn}
      </DialogContent>
    </Dialog>
  );

  // ---- Standalone mode ----
  return (
    <>
      <div className="flex-1 flex flex-col h-full gap-6">
        <div className="flex items-start justify-between">
          <div className="text-left">
            <h2 className="text-xl font-headline">{t('mediaAdmin.mediaLibrary')}</h2>
            <p className="text-muted-foreground mt-1 text-sm">{t('mediaAdmin.description')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsFullLibraryOpen(true)} variant="outline" size="sm">
              <FontAwesomeIcon icon={faFolderOpen} className="mr-2" />
              {t('mediaAdmin.browseFullLibrary')}
            </Button>
          </div>
        </div>
        <Separator className="bg-white/10" />
        <div className="border rounded-lg p-6 glass-effect flex flex-col gap-4">
          {uploadStrip}
        </div>
      </div>
      {fullLibraryDialog}
      {previewDialog}
      {setBackgroundDialog}
      {provider === 'cloudinary' && <AddFromUrlDialog isOpen={isAddFromUrlOpen} onOpenChange={setIsAddFromUrlOpen} onUploadComplete={handleCloudinaryUrlUploadComplete} />}
      {vercelAddFromUrlDialog}
      {cloudinaryUploadFlowDialogs}
      {bulkDeleteDialog}
      <BulkActionBar selectedCount={selectedIds.size} onClearSelection={() => setSelectedIds(new Set())} onDelete={() => setIsBulkDeleteOpen(true)} />
    </>
  );
});
