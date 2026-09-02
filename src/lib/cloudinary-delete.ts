import { initializeServerApp } from '@/firebase/server-init';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { SUPERADMIN_EMAIL } from '@/lib/constants';

export interface DeleteCloudinaryAssetInput {
  publicId?: string;
  resourceType?: string;
  libraryId?: string;
  idToken?: string;
}

export interface DeleteCloudinaryAssetResult {
  success: boolean;
  message: string;
  status: number;
}

// Only an authenticated superadmin (or a user with the delete permission) may
// delete a Cloudinary asset. Denies closed on any verification failure.
async function canDeleteMedia(idToken?: string): Promise<boolean> {
  if (!idToken) return false;
  try {
    const app = await initializeServerApp();
    const decoded = await getAuth(app).verifyIdToken(idToken);
    if (decoded.email === SUPERADMIN_EMAIL) return true;
    const snap = await getFirestore(app).collection('users').doc(decoded.uid).get();
    if (snap.exists) {
      const data = snap.data() as any;
      if (data?.permissions?.canDeleteMedia === true) return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Permanently deletes a Cloudinary asset using the signed server-side API
 * (the API secret must never reach the browser). This helper intentionally
 * does NOT import Genkit: it is used by the HTTP route handler so the delete
 * path avoids the Server-Action/Flight layer entirely and surfaces real
 * error messages instead of an opaque "Minified React error #441".
 *
 * Normalizes defensive values from legacy/anomalous documents (unexpected
 * `libraryId`, `resource_type`, empty `public_id`) instead of rejecting them,
 * and never throws — every failure is returned as a result object.
 */
export async function deleteCloudinaryAsset(
  input: DeleteCloudinaryAssetInput
): Promise<DeleteCloudinaryAssetResult> {
  if (!(await canDeleteMedia(input.idToken))) {
    return { success: false, message: 'Unauthorized. You are not allowed to delete media.', status: 403 };
  }

  const safePublicId = input.publicId?.trim() ?? '';
  if (!safePublicId) {
    return { success: false, message: 'Missing Cloudinary public id; cannot delete this asset.', status: 400 };
  }
  const safeResourceType = (['image', 'video', 'raw'].includes(input.resourceType ?? '')
    ? input.resourceType
    : 'image') as 'image' | 'video' | 'raw';
  const safeLibraryId = input.libraryId === 'extented' ? 'extented' : 'primary';

  const suffix = safeLibraryId === 'primary' ? '_1' : '_2';

  const cloudName = process.env[`CLOUDINARY_CLOUD_NAME${suffix}`];
  const apiKey = process.env[`CLOUDINARY_API_KEY${suffix}`];
  const apiSecret = process.env[`CLOUDINARY_API_SECRET${suffix}`];

  if (!cloudName || !apiKey || !apiSecret) {
    const message = `Cloudinary credentials for ${safeLibraryId} library are missing. Please check your .env file for CLOUDINARY_CLOUD_NAME${suffix}, CLOUDINARY_API_KEY${suffix}, and CLOUDINARY_API_SECRET${suffix}.`;
    console.error('[delete-media] missing credentials:', message);
    return { success: false, message, status: 500 };
  }

  console.log('[delete-media] calling cloudinary destroy', { publicId: safePublicId, resourceType: safeResourceType, library: safeLibraryId });

  try {
    const cloudinary = (await import('cloudinary')).v2;
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    // invalidate: purge CDN-cached derivatives so the asset stops being served.
    const result = await cloudinary.uploader.destroy(safePublicId, {
      resource_type: safeResourceType,
      invalidate: true,
    });

    // "not found" counts as success — the asset is gone either way.
    if (result.result === 'ok' || result.result === 'not found') {
      return { success: true, message: `Cloudinary asset ${safePublicId} deleted.`, status: 200 };
    }
    return {
      success: false,
      message: `Cloudinary returned "${result.result}" for ${safePublicId}.`,
      status: 502,
    };
  } catch (error: any) {
    console.error('deleteCloudinaryAsset: Cloudinary delete failed.', error);
    return { success: false, message: error?.message || 'Cloudinary deletion failed.', status: 500 };
  }
}