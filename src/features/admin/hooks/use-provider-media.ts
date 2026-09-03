import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { addDoc, collection, deleteDoc, doc, orderBy, query, updateDoc } from 'firebase/firestore';
import { getMediaCapabilities } from '@/features/admin/lib/media-capabilities';
import { toMediaLibraryAsset, type MediaLibraryAsset } from '@/features/admin/lib/media-asset';
import { useMediaMeta } from '@/features/admin/hooks/use-media-meta';
import { gumletImageDeliveryFormatUrl } from '@/lib/gumlet-image';
import { type MediaMetaProvider, type MediaMetaTag } from '@/lib/media-meta';
import type { MediaProvider, ProviderAssetRecord } from '@/lib/media-providers';
import { IMAGEKIT_MEDIA_COLLECTION, type ImageKitMediaAsset } from '@/lib/imagekit';
import { useUploadProgress, type MediaProviderKey } from '@/components/upload-progress-context';

// Map the hook's MediaProvider value to the notification system's provider key.
function toProviderKey(provider: MediaProvider): MediaProviderKey {
  return provider === 'vercel_blob' ? 'vercel' : (provider as MediaProviderKey);
}

/**
 * Provider-neutral media hook used by the unified admin media library.
 *
 * For Appwrite, Gumlet Video and Gumlet Image it lists via the provider APIs,
 * merges `media_meta` color tags, and implements upload/link/delete/copy.
 * Cloudinary and Vercel Blob keep their Firestore list (used by their
 * existing dedicated MediaLibrary component).
 */

interface CloudinaryAssetDoc {
  id: string;
  url: string;
  public_id: string;
  resource_type: 'image' | 'video' | 'raw';
  created_at: string;
  filename: string;
  libraryId?: 'primary' | 'extented' | string;
  videoFormat?: string;
  title?: string;
  tag?: MediaMetaTag;
}

interface VercelBlobDoc {
  id: string;
  url: string;
  pathname: string;
  size?: number;
  contentType?: string;
  filename: string;
  uploadedAt?: any;
  tag?: MediaMetaTag;
}

interface GumletVideoAssetLike {
  assetId: string;
  title?: string;
  playbackUrl?: string;
  thumbnailUrl?: string;
  createdAt?: string;
  status?: string;
  format?: string;
}

interface GumletImageAssetLike {
  id: string;
  sourceUrl: string;
  deliveryUrl: string;
  filename: string;
  createdAt?: string;
}

interface ImageKitAssetDoc extends ImageKitMediaAsset {
  id: string;
}

export interface ProviderMediaApi {
  provider: MediaProvider;
  capabilities: ReturnType<typeof getMediaCapabilities>;
  assets: MediaLibraryAsset[];
  isLoading: boolean;
  isUploading: boolean;
  uploadProgress: number;
  uploadFileName: string;
  /** Upload a local file (file-picker or drag-&-drop). */
  uploadFile: (file: File) => Promise<{ ok: boolean; url?: string; error?: string }>;
  /** Import a remote file by URL. */
  uploadByLink: (url: string, filename?: string, format?: 'ABR' | 'MP4') => Promise<{ ok: boolean; url?: string; error?: string }>;
  /** Delete an asset server-side and from its registry. */
  deleteAsset: (asset: MediaLibraryAsset) => Promise<{ ok: boolean; error?: string }>;
  /** Persist/clear a color tag. */
  setTag: (asset: MediaLibraryAsset, tag: MediaMetaTag | null) => Promise<{ ok: boolean; error?: string }>;
  /** Produce the copyable delivery URL for a given format key. */
  copyUrl: (asset: MediaLibraryAsset, formatKey: string) => string;
  cancelUpload: () => void;
  refresh: () => void;
}

const API_ROUTE: Record<MediaProvider, string | null> = {
  appwrite: '/api/appwrite/media',
  gumlet_video: '/api/gumlet/video',
  gumlet_image: '/api/gumlet/image',
  imagekit: '/api/imagekit/media',
  cloudinary: null,
  vercel_blob: null,
};

const managedProviders: MediaProvider[] = ['appwrite', 'gumlet_video', 'gumlet_image'];

export function useProviderMedia(provider: MediaProvider): ProviderMediaApi {
  const firestore = useFirestore();
  const auth = useAuth();
  const { getTag, setTag: setMetaTag } = useMediaMeta();
  const { startUpload: startGlobalUpload, updateProgress: updateGlobalProgress, finishUpload: finishGlobalUpload, signalCompletedUpload } = useUploadProgress();
  const [managedAssets, setManagedAssets] = useState<MediaLibraryAsset[]>([]);
  const [isManagedLoading, setIsManagedLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState('');
  const activeXhrRef = useRef<XMLHttpRequest | null>(null);
  const isManaged = managedProviders.includes(provider);

  const capabilities = useMemo(() => getMediaCapabilities(provider), [provider]);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  // ---- Auth token ----
  const getToken = useCallback(async (): Promise<string | null> => {
    const currentUser = auth?.currentUser;
    if (!currentUser) return null;
    try {
      return await currentUser.getIdToken();
    } catch {
      return null;
    }
  }, [auth]);

  // ---- Managed-provider list via API ----
  useEffect(() => {
    const route: string | null = API_ROUTE[provider];
    if (!route || !isManaged) return;
    let cancelled = false;
    async function loadManaged() {
      setIsManagedLoading(true);
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        if (!route) return;
        const response = await fetch(route, { headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'Could not load media.');
        if (cancelled) return;
        const list: MediaLibraryAsset[] = provider === 'appwrite'
          ? (data.files as ProviderAssetRecord[]).map((f: ProviderAssetRecord) => toMediaLibraryAsset('appwrite', f))
          : provider === 'gumlet_video'
            ? (data.assets as GumletVideoAssetLike[]).map(gumletVideoToAsset)
            : (data.images as GumletImageAssetLike[]).map(gumletImageToAsset);
        setManagedAssets(list);
      } catch {
        if (!cancelled) setManagedAssets([]);
      } finally {
        if (!cancelled) setIsManagedLoading(false);
      }
    }
    void loadManaged();
    return () => { cancelled = true; };
  }, [provider, reloadKey, getToken, isManaged]);

  const assets = useMemo<MediaLibraryAsset[]>(() => {
    if (!isManaged) return [];
    return managedAssets.map((asset) => {
      const metaKey = managedMetaKey(provider, asset.id);
      const tag = metaKey ? getTag(metaKey.provider, metaKey.assetId) : undefined;
      return tag ? { ...asset, tag } : asset;
    });
  }, [managedAssets, getTag, provider, isManaged]);

  // ---- Firebase-backed list (Cloudinary/Vercel) ----
  const colRef = useMemoFirebase(() => {
    if (!firestore || isManaged) return null;
    const target = provider === 'cloudinary'
      ? 'media'
      : provider === 'imagekit'
        ? IMAGEKIT_MEDIA_COLLECTION
        : 'vercel_blobs';
    const orderField = provider === 'cloudinary' ? 'created_at' : provider === 'imagekit' ? 'createdAt' : 'uploadedAt';
    return query(collection(firestore, target), orderBy(orderField, 'desc'));
  }, [firestore, provider, isManaged]);
  const { data: firebaseDocs, isLoading: isFirebaseLoading } = useCollection<CloudinaryAssetDoc | VercelBlobDoc | ImageKitAssetDoc>(colRef as any);
  const firebaseAssets = useMemo<MediaLibraryAsset[]>(
    () => (isManaged || !firebaseDocs ? [] : firebaseDocs.map((asset) => provider === 'imagekit'
      ? imageKitToAsset(asset as ImageKitAssetDoc)
      : toMediaLibraryAsset(provider, asset as CloudinaryAssetDoc | VercelBlobDoc))),
    [firebaseDocs, provider, isManaged]
  );

  // ---- uploadFile ----
  const uploadFile = useCallback(
    async (file: File): Promise<{ ok: boolean; url?: string; error?: string }> => {
      setUploadFileName(file.name);
      setIsUploading(true);
      setUploadProgress(5);
      startGlobalUpload(file.name, toProviderKey(provider));
      try {
        const token = await getToken();
        if (!token) {
          finishGlobalUpload(toProviderKey(provider));
          return { ok: false, error: 'Not authenticated.' };
        }

        if (provider === 'imagekit') {
          if (!firestore) throw new Error('Firestore is unavailable.');
          const uploaded = await uploadImageKitAsset(file, file.name, token, (progress) => { setUploadProgress(progress); updateGlobalProgress(progress, 'imagekit'); }, activeXhrRef);
          const record = imageKitRecord(uploaded);
          const ref = await registerImageKitAsset(record, token);
          signalCompletedUpload(ref, record.fileType === 'image' ? 'image' : record.fileType === 'video' ? 'video' : 'raw', 'imagekit', 'imagekit', file.name);
          return { ok: true, url: record.url };
        }

        if (provider === 'gumlet_video') {
          const result = await uploadGumletVideo(
            file,
            'ABR',
            token,
            (p) => { setUploadProgress(p); updateGlobalProgress(p, toProviderKey(provider)); },
            activeXhrRef
          );
          if (result.ok && result.url) {
            const assetId = result.url.replace(/^asset:/, '');
            signalCompletedUpload(assetId, 'video', 'gumlet_video', 'gumlet_video', file.name);
          }
          return result;
        }

        // Appwrite / Gumlet Image multipart upload.
        if (provider === 'appwrite') {
          const body = new FormData();
          body.append('file', file);
          updateGlobalProgress(15, toProviderKey(provider));
          const response = await fetch('/api/appwrite/media', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body,
          });
          const data = await response.json();
          if (!response.ok || !data.success) throw new Error(data.message || 'Upload failed.');
          const uploaded = data.file as ProviderAssetRecord;
          setUploadProgress(100);
          updateGlobalProgress(100, toProviderKey(provider));
          setManagedAssets((current) => [toMediaLibraryAsset('appwrite', uploaded), ...current]);
          signalCompletedUpload(
            uploaded.providerAssetId,
            uploaded.resourceType,
            'appwrite',
            'appwrite',
            file.name
          );
          return { ok: true, url: uploaded.url };
        }

        return { ok: false, error: `${provider === 'gumlet_image' ? 'Gumlet Image' : provider} does not support file upload.` };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Upload failed.' };
      } finally {
        setUploadProgress(0);
        setIsUploading(false);
        setUploadFileName('');
        finishGlobalUpload(toProviderKey(provider));
      }
    },
    [getToken, provider, firestore, startGlobalUpload, updateGlobalProgress, finishGlobalUpload, signalCompletedUpload]
  );

  // ---- uploadByLink ----
  const uploadByLink = useCallback(
    async (url: string, filename?: string, format?: 'ABR' | 'MP4'): Promise<{ ok: boolean; url?: string; error?: string }> => {
      setUploadFileName(filename || url);
      setIsUploading(true);
      setUploadProgress(10);
      startGlobalUpload(filename || url, toProviderKey(provider));
      try {
        const token = await getToken();
        if (!token) {
          finishGlobalUpload(toProviderKey(provider));
          return { ok: false, error: 'Not authenticated.' };
        }
        let created: MediaLibraryAsset | null = null;

        if (provider === 'imagekit') {
          if (!firestore) throw new Error('Firestore is unavailable.');
          const imported = await uploadImageKitAsset(url, filename || filenameFromUrl(url), token, (progress) => { setUploadProgress(progress); updateGlobalProgress(progress, 'imagekit'); }, activeXhrRef);
          const record = imageKitRecord(imported);
          const ref = await registerImageKitAsset(record, token);
          created = imageKitToAsset({ id: ref, ...record });
          signalCompletedUpload(ref, created.resourceType, 'imagekit', 'imagekit', created.filename);
        } else if (provider === 'appwrite') {
          const response = await fetch('/api/appwrite/media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ sourceUrl: url, filename }),
          });
          const data = await response.json();
          if (!response.ok || !data.success) throw new Error(data.message || 'Link import failed.');
          created = toMediaLibraryAsset('appwrite', data.file as ProviderAssetRecord);
        } else if (provider === 'gumlet_video') {
          const response = await fetch('/api/gumlet/video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ sourceUrl: url, format: format ?? 'ABR', title: filename?.replace(/\.[^.]+$/, '') || undefined }),
          });
          const data = await response.json();
          if (!response.ok || !data.success) throw new Error(data.message || 'Link import failed.');
          created = gumletVideoToAsset(data.asset as GumletVideoAssetLike);
        } else if (provider === 'gumlet_image') {
          const response = await fetch('/api/gumlet/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ sourceUrl: url }),
          });
          const data = await response.json();
          if (!response.ok || !data.success) throw new Error(data.message || 'Link import failed.');
          created = gumletImageToAsset(data.image as GumletImageAssetLike);
        }

        if (created) {
          setManagedAssets((current) => [created!, ...current]);
          setUploadProgress(100);
          updateGlobalProgress(100, toProviderKey(provider));
          signalCompletedUpload(
            created.id,
            created.resourceType,
            provider === 'gumlet_video' ? 'gumlet_video' : provider === 'gumlet_image' ? 'gumlet_image' : 'appwrite',
            toProviderKey(provider),
            created.filename
          );
          return { ok: true, url: created.url };
        }
        return { ok: false, error: 'Unsupported provider for link import.' };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Link import failed.' };
      } finally {
        setUploadProgress(0);
        setIsUploading(false);
        setUploadFileName('');
        finishGlobalUpload(toProviderKey(provider));
      }
    },
    [getToken, provider, firestore, startGlobalUpload, updateGlobalProgress, finishGlobalUpload, signalCompletedUpload]
  );

  // ---- deleteAsset ----
  const deleteAsset = useCallback(
    async (asset: MediaLibraryAsset): Promise<{ ok: boolean; error?: string }> => {
      const token = await getToken();
      if (!token) return { ok: false, error: 'Not authenticated.' };
      const route = API_ROUTE[provider];
      if (!route) return { ok: false, error: 'Delete not available for this provider.' };
      const body = provider === 'imagekit'
        ? { fileId: asset.providerAssetKey }
        : provider === 'appwrite' ? { fileId: asset.id } : provider === 'gumlet_video' ? { assetId: asset.id } : { id: asset.id };
      try {
        const response = await fetch(route, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'Delete failed.');
        if (provider === 'imagekit' && firestore) await deleteDoc(doc(firestore, IMAGEKIT_MEDIA_COLLECTION, asset.id));
        setManagedAssets((current) => current.filter((a) => a.id !== asset.id));
        const meta = managedMetaKey(provider, asset.id);
        if (meta) await setMetaTag(meta.provider, meta.assetId, null);
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Delete failed.' };
      }
    },
    [getToken, provider, setMetaTag, firestore]
  );

  // ---- setTag ----
  const setTag = useCallback(
    async (asset: MediaLibraryAsset, tag: MediaMetaTag | null): Promise<{ ok: boolean; error?: string }> => {
      if (provider === 'imagekit') {
        if (!firestore) return { ok: false, error: 'Firestore is unavailable.' };
        try {
          await updateDoc(doc(firestore, IMAGEKIT_MEDIA_COLLECTION, asset.id), { tag });
          return { ok: true };
        } catch (error) {
          return { ok: false, error: error instanceof Error ? error.message : 'Could not update tag.' };
        }
      }
      const meta = managedMetaKey(provider, asset.id);
      if (!meta) return { ok: false, error: 'Tags are not supported for this provider.' };
      const result = await setMetaTag(meta.provider, meta.assetId, tag);
      if (result.ok) {
        setManagedAssets((current) => current.map((a) => (a.id === asset.id ? { ...a, tag: tag ?? undefined } : a)));
      }
      return result;
    },
    [provider, setMetaTag, firestore]
  );

  // ---- copyUrl ----
  const copyUrl = useCallback((asset: MediaLibraryAsset, formatKey: string): string => {
    if (provider === 'cloudinary') {
      return formatKey === 'original' ? asset.url : makeCloudinaryFormatUrl(asset.url, formatKey);
    }
    if (provider === 'gumlet_image' && formatKey !== 'original') {
      return gumletImageDeliveryFormatUrl(asset.url, formatKey as 'webp' | 'avif' | 'jpg' | 'png' | 'auto');
    }
    return asset.url;
  }, [provider]);

  const cancelUpload = useCallback(() => {
    activeXhrRef.current?.abort();
    activeXhrRef.current = null;
    setIsUploading(false);
    setUploadProgress(0);
    setUploadFileName('');
  }, []);

  const isLoading = isManaged ? isManagedLoading : isFirebaseLoading;

  return {
    provider,
    capabilities,
    assets: isManaged ? assets : firebaseAssets,
    isLoading,
    isUploading,
    uploadProgress,
    uploadFileName,
    uploadFile,
    uploadByLink,
    deleteAsset,
    setTag,
    copyUrl,
    cancelUpload,
    refresh,
  };
}

// ---- Provider asset normalization helpers ----

function gumletVideoToAsset(asset: GumletVideoAssetLike): MediaLibraryAsset {
  return {
    id: asset.assetId,
    provider: 'gumlet_video',
    url: asset.playbackUrl || '',
    filename: asset.title || asset.assetId,
    resourceType: 'video',
    createdAt: asset.createdAt,
    videoFormat: asset.format,
    title: asset.title,
  };
}

function gumletImageToAsset(image: GumletImageAssetLike): MediaLibraryAsset {
  return {
    id: image.id,
    provider: 'gumlet_image',
    url: image.deliveryUrl,
    filename: image.filename,
    resourceType: 'image',
    createdAt: image.createdAt,
  };
}

function managedMetaKey(provider: MediaProvider, assetId: string): { provider: MediaMetaProvider; assetId: string } | null {
  if (provider === 'appwrite' || provider === 'gumlet_video' || provider === 'gumlet_image') {
    return { provider, assetId };
  }
  return null;
}

interface ImageKitUploadResponse {
  fileId: string; url: string; name: string; fileType: 'image' | 'video' | 'non-image';
  filePath?: string; thumbnailUrl?: string; size?: number;
}

function filenameFromUrl(url: string): string {
  try { return new URL(url).pathname.split('/').pop() || 'imported-file'; } catch { return 'imported-file'; }
}

function imageKitRecord(asset: ImageKitUploadResponse): ImageKitMediaAsset {
  return { provider: 'imagekit', fileId: asset.fileId, url: asset.url, name: asset.name, fileType: asset.fileType, filePath: asset.filePath, thumbnailUrl: asset.thumbnailUrl, size: asset.size, createdAt: new Date().toISOString() };
}

function imageKitToAsset(asset: ImageKitAssetDoc): MediaLibraryAsset {
  return { id: asset.id, provider: 'imagekit', providerAssetKey: asset.fileId, url: asset.url, filename: asset.name, resourceType: asset.fileType === 'image' ? 'image' : asset.fileType === 'video' ? 'video' : 'raw', size: asset.size, createdAt: asset.createdAt, tag: asset.tag };
}

async function uploadImageKitAsset(file: File | string, fileName: string, token: string, onProgress: (percent: number) => void, activeXhrRef: { current: XMLHttpRequest | null }): Promise<ImageKitUploadResponse> {
  const authResponse = await fetch('/api/imagekit/auth', { headers: { Authorization: `Bearer ${token}` } });
  const auth = await authResponse.json();
  if (!authResponse.ok || !auth.success) throw new Error(auth.message || 'Could not authorize ImageKit upload.');
  const data = new FormData();
  data.append('file', file); data.append('fileName', fileName.replace(/[^a-zA-Z0-9._-]/g, '_'));
  data.append('publicKey', auth.publicKey); data.append('token', auth.token); data.append('signature', auth.signature); data.append('expire', String(auth.expire));
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest(); activeXhrRef.current = xhr;
    xhr.open('POST', 'https://upload.imagekit.io/api/v1/files/upload');
    xhr.upload.onprogress = (event) => { if (event.lengthComputable) onProgress(Math.round(event.loaded / event.total * 100)); };
    xhr.onload = () => { activeXhrRef.current = null; try { const payload = JSON.parse(xhr.responseText); xhr.status >= 200 && xhr.status < 300 ? resolve(payload) : reject(new Error(payload.message || `ImageKit upload failed (${xhr.status}).`)); } catch { reject(new Error(`ImageKit upload failed (${xhr.status}).`)); } };
    xhr.onerror = () => { activeXhrRef.current = null; reject(new Error('Network error during ImageKit upload.')); };
    xhr.onabort = () => { activeXhrRef.current = null; reject(new Error('Upload cancelled.')); };
    xhr.send(data);
  });
}

async function registerImageKitAsset(asset: ImageKitMediaAsset, token: string): Promise<string> {
  const response = await fetch('/api/imagekit/media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(asset),
  });
  const payload = await response.json();
  if (!response.ok || !payload.success || !payload.id) {
    throw new Error(payload.message || 'ImageKit uploaded the file, but the media library record could not be created.');
  }
  return payload.id;
}

// ---- Gumlet Video direct upload (create intent, then PUT) ----
interface GumletUploadIntent {
  assetId: string;
  uploadUrl: string;
}

async function uploadGumletVideo(
  file: File,
  format: 'ABR' | 'MP4',
  token: string,
  onProgress: (percent: number) => void,
  activeXhrRef: { current: XMLHttpRequest | null }
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const title = file.name.replace(/\.[^.]+$/, '');
  const intentResponse = await fetch('/api/gumlet/video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title, format }),
  });
  const intentData = await intentResponse.json();
  if (!intentResponse.ok || !intentData.success) {
    throw new Error(intentData.message || 'Could not create Gumlet upload.');
  }
  const upload = intentData.upload as GumletUploadIntent;
  onProgress(15);
  const put = await new Promise<boolean>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    activeXhrRef.current = xhr;
    xhr.open('PUT', upload.uploadUrl);
    if (xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(Math.max(15, Math.round((event.loaded / event.total) * 85) + 15));
      };
    }
    xhr.onload = () => {
      activeXhrRef.current = null;
      xhr.status >= 200 && xhr.status < 300 ? resolve(true) : reject(new Error(`Gumlet upload failed (${xhr.status}).`));
    };
    xhr.onerror = () => {
      activeXhrRef.current = null;
      reject(new Error('Network error during Gumlet upload.'));
    };
    xhr.onabort = () => {
      activeXhrRef.current = null;
      reject(new Error('Upload cancelled.'));
    };
    xhr.send(file);
  });
  if (!put) return { ok: false, error: 'Upload failed.' };
  onProgress(100);
  return { ok: true, url: `asset:${upload.assetId}` };
}

// ---- Cloudinary format-variant URL helper (subset of legacy MediaLibrary) ----
const CLOUDINARY_UPLOAD_RE = /\/(image|video|raw)\/upload\//;
const withTransform = (url: string, transform: string): string =>
  url.replace(CLOUDINARY_UPLOAD_RE, (m) => `${m}${transform}/`);
const stripTransforms = (url: string): string =>
  url.replace(/^(.*?\/upload)(?:\/[^/]+)?(\/v\d+\/)/, '$1$2');
const CLOUDINARY_FORMATS = ['mp4', 'webm', 'webp', 'avif', 'jpg', 'png'] as const;

function makeCloudinaryFormatUrl(url: string, formatKey: string): string {
  if ((CLOUDINARY_FORMATS as readonly string[]).includes(formatKey)) {
    const out = withTransform(stripTransforms(url), `f_${formatKey},q_auto,fl_attachment`);
    return out.replace(/\.(m3u8|webm|mp4|mov|jpeg|jpg|png|gif|webp|avif)$/i, `.${formatKey}`);
  }
  if (formatKey === 'hls') {
    const stripped = stripTransforms(url).replace(/\.[a-z0-9]+$/i, '.m3u8');
    return withTransform(stripped, 'sp_auto');
  }
  return url;
}

export type MediaProviderApi = ProviderMediaApi;
