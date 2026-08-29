'use client';

import { useCallback, useState } from 'react';
import { useAuth, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { useUploadProgress } from '@/components/upload-progress-context';
import { collection, doc, serverTimestamp } from 'firebase/firestore';

// Module-scoped abort handles. Mirrors the pattern in MediaLibrary.tsx so
// the cancel affordance (and the upload-progress notification) can reach
// the in-flight upload even if the picker unmounts mid-upload.
const activeXhrRef: { current: XMLHttpRequest | null } = { current: null };
const activeBlobAbortRef: { current: AbortController | null } = { current: null };
const currentUploadFileRef: { current: File | null } = { current: null };

export type MediaProvider = 'cloudinary' | 'vercel';
export type LibraryId = 'primary' | 'extented';
export type ResourceType = 'image' | 'video' | 'raw';

export interface UploadResult {
  url: string;
  /** Cloudinary public_id when applicable. */
  publicId?: string;
  /** For Vercel Blob, the pathname. */
  pathname?: string;
  contentType: string;
  size: number;
  filename: string;
  resourceType: ResourceType;
  provider: MediaProvider;
  libraryId?: LibraryId;
}

export interface UseMediaUploadOptions {
  provider: MediaProvider;
  libraryId?: LibraryId;
  /** When false, hides the upload affordance and makes upload() no-op. */
  enabled?: boolean;
  /**
   * Where the upload was initiated from. Lets consumers (e.g. MediaLibrary)
   * decide whether the "completed upload" event should auto-open the full
   * library dialog or stay inside the originating surface (e.g. media picker).
   */
  source?: 'media-library' | 'media-picker';
}

export interface UseMediaUploadReturn {
  upload: (file: File) => Promise<UploadResult>;
  cancel: () => void;
  isUploading: boolean;
  progress: number;
  error: Error | null;
  /** Reset the hook state (clears `error` and `progress`) without affecting the in-flight upload. */
  reset: () => void;
}

async function getAuthToken(auth: ReturnType<typeof useAuth>): Promise<string | null> {
  const user = auth?.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch {
    return null;
  }
}

function mapContentTypeToResourceType(contentType: string): ResourceType {
  const c = (contentType || '').toLowerCase();
  if (c.startsWith('image/')) return 'image';
  if (c.startsWith('video/')) return 'video';
  return 'raw';
}

function formatFilename(s: string): string {
  return s.replace(/[^a-zA-Z0-9._-]/g, '_') || 'file';
}

function uploadToCloudinary(
  file: File,
  libraryId: LibraryId,
  hooks: {
    onProgress: (pct: number) => void;
    signal: { aborted: boolean };
  }
): Promise<UploadResult> {
  const cloudName = libraryId === 'primary'
    ? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_1
    : process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_2;
  const uploadPreset = libraryId === 'primary'
    ? process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_1
    : process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_2;

  if (!cloudName || !uploadPreset || uploadPreset.includes('your_unsigned_preset')) {
    return Promise.reject(
      new Error(
        `Cloudinary is not configured for the ${libraryId === 'primary' ? 'primary' : 'extented'} library. ` +
        `Check NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_${libraryId === 'primary' ? '1' : '2'} and ` +
        `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_${libraryId === 'primary' ? '1' : '2'} in your env vars.`
      )
    );
  }

  return new Promise<UploadResult>((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, true);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        hooks.onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onabort = () => reject(new DOMException('Upload cancelled', 'AbortError'));
    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({
            url: response.secure_url,
            publicId: response.public_id,
            contentType: response.resource_type === 'video' ? `video/${response.format || 'mp4'}`
              : response.resource_type === 'image' ? `image/${response.format || 'jpg'}`
              : file.type || 'application/octet-stream',
            size: response.bytes ?? file.size,
            filename: file.name,
            resourceType: (response.resource_type as ResourceType) || mapContentTypeToResourceType(file.type),
            provider: 'cloudinary',
            libraryId,
          });
        } catch (e) {
          reject(new Error('Invalid Cloudinary response'));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText)?.error;
          reject(new Error(err?.message || `Cloudinary upload failed (${xhr.status})`));
        } catch {
          reject(new Error(`Cloudinary upload failed (${xhr.status})`));
        }
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.ontimeout = () => reject(new Error('Upload timed out'));

    // If the consumer cancels before this point, abort.
    if (hooks.signal.aborted) {
      xhr.abort();
      return;
    }

    activeXhrRef.current = xhr;
    xhr.send(formData);
  });
}

function uploadToVercel(
  file: File,
  token: string,
  hooks: {
    onProgress: (pct: number) => void;
    signal: { aborted: boolean };
  }
): Promise<UploadResult> {
  // For picker uploads, the file is bounded (user just picked it) so the
  // proxy route is fine. For very large videos MediaLibrary uses the
  // @vercel/blob/client upload() with handleUploadUrl; we keep this hook
  // simple and use the proxy for everything.
  return new Promise<UploadResult>((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/vercel-blob/upload');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.timeout = 120_000;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        hooks.onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onabort = () => reject(new DOMException('Upload cancelled', 'AbortError'));
    xhr.onload = () => {
      try {
        const parsed = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && parsed.success) {
          resolve({
            url: parsed.url,
            pathname: parsed.pathname,
            contentType: parsed.contentType || file.type || 'application/octet-stream',
            size: parsed.size ?? file.size,
            filename: file.name,
            resourceType: mapContentTypeToResourceType(parsed.contentType || file.type),
            provider: 'vercel',
          });
        } else {
          reject(new Error(parsed?.message || `Upload failed (${xhr.status})`));
        }
      } catch {
        reject(new Error('Invalid server response'));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.ontimeout = () => reject(new Error('Upload timed out. The server may be unreachable.'));

    if (hooks.signal.aborted) {
      xhr.abort();
      return;
    }

    activeXhrRef.current = xhr;
    xhr.send(form);
  });
}

export function useMediaUpload({ provider, libraryId, enabled = true, source }: UseMediaUploadOptions): UseMediaUploadReturn {
  const auth = useAuth();
  const firestore = useFirestore();
  const {
    startUpload: startGlobalUpload,
    updateProgress: updateGlobalProgress,
    finishUpload: finishGlobalUpload,
    signalCompletedUpload,
  } = useUploadProgress();

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const upload = useCallback(
    async (file: File): Promise<UploadResult> => {
      if (!enabled) throw new Error('Upload is not enabled in this context.');
      if (provider === 'cloudinary' && !libraryId) {
        throw new Error('libraryId is required for Cloudinary uploads.');
      }
      const token = await getAuthToken(auth);
      if (!token) throw new Error('You are not signed in.');
      if (!firestore) throw new Error('Firestore is not available.');

      setIsUploading(true);
      setProgress(0);
      setError(null);
      startGlobalUpload(file.name, provider);
      currentUploadFileRef.current = file;

      const localSignal = { aborted: false };
      const onProgress = (p: number) => {
        setProgress(p);
        updateGlobalProgress(p, provider);
      };

      try {
        const result = provider === 'cloudinary'
          ? await uploadToCloudinary(file, libraryId as LibraryId, { onProgress, signal: localSignal })
          : await uploadToVercel(file, token, { onProgress, signal: localSignal });

        // Write the Firestore mirror so the picker (and the rest of the app)
        // can find the new file.
        try {
          if (result.provider === 'cloudinary') {
            await setDocumentNonBlocking(
              doc(firestore, 'media', result.publicId || result.url),
              {
                public_id: result.publicId,
                url: result.url,
                resource_type: result.resourceType,
                created_at: new Date().toISOString(),
                filename: result.filename,
                libraryId: result.libraryId,
              } as any,
              {}
            );
          } else {
            await addDocumentNonBlocking(collection(firestore, 'vercel_blobs'), {
              provider: 'vercel_blob',
              url: result.url,
              pathname: result.pathname,
              size: result.size,
              contentType: result.contentType,
              filename: result.filename,
              uploadedAt: serverTimestamp(),
              uploadedBy: auth?.currentUser?.uid || null,
            } as any);
          }
        } catch (e) {
          // Mirror write failure isn't fatal — the file is already in
          // Cloudinary/Vercel. Log and continue.
          console.warn('useMediaUpload: Firestore mirror failed', e);
        }

        setProgress(100);
        updateGlobalProgress(100, provider);
        finishGlobalUpload(provider);

        const docId = result.publicId || result.pathname || result.url;
        signalCompletedUpload(
          docId,
          result.resourceType,
          result.provider === 'cloudinary' ? (result.libraryId as 'primary' | 'extented') : 'vercel_blob',
          result.provider,
          result.filename,
          source
        );

        return result;
      } catch (e: any) {
        finishGlobalUpload(provider);
        const err = e instanceof Error ? e : new Error(String(e?.message || e));
        setError(err);
        throw err;
      } finally {
        activeXhrRef.current = null;
        activeBlobAbortRef.current = null;
        currentUploadFileRef.current = null;
        setIsUploading(false);
      }
    },
    [auth, firestore, provider, libraryId, enabled, source, startGlobalUpload, updateGlobalProgress, finishGlobalUpload, signalCompletedUpload]
  );

  const cancel = useCallback(() => {
    if (activeXhrRef.current) {
      activeXhrRef.current.abort();
      activeXhrRef.current = null;
    }
    if (activeBlobAbortRef.current) {
      activeBlobAbortRef.current.abort();
      activeBlobAbortRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    setProgress(0);
    setError(null);
  }, []);

  return { upload, cancel, isUploading, progress, error, reset };
}
