import { initializeServerApp } from '@/firebase/server-init';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createHash } from 'node:crypto';
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
 * Cloudinary API signature: sort params alphabetically, serialize as
 * `key=value&...` (no header/`&` separators), append the API secret, SHA-1 hex.
 * https://cloudinary.com/documentation/signature_calculation
 */
function cloudinarySignature(params: Record<string, string>, apiSecret: string): string {
  const body = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('sha1').update(body + apiSecret).digest('hex');
}

/**
 * Permanently deletes a Cloudinary asset using the signed server-side API
 * (the API secret must never reach the browser). This helper intentionally
 * does NOT import Genkit: it is used by the HTTP route handler so the delete
 * path avoids the Server-Action/Flight layer entirely and surfaces real
 * error messages instead of an opaque "Minified React error #441".
 *
 * The delete call goes through the global `fetch` against Cloudinary's REST
 * API — the same mechanism the browser upload path already uses — instead of
 * the `cloudinary` npm package, whose HTTPS/TLS path has been observed to
 * kill the serverless process mid-request (empty-bodied 500).
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
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signParams: Record<string, string> = {
      public_id: safePublicId,
      timestamp,
      invalidate: 'true',
    };
    const signature = cloudinarySignature(signParams, apiSecret);

    const form = new URLSearchParams({
      ...signParams,
      api_key: apiKey,
      signature,
    });

    // AbortSignal.timeout guards against a hanging Cloudinary connection,
    // which would otherwise kill the serverless function mid-request and
    // surface as an opaque empty-bodied 500 instead of a readable error.
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${safeResourceType}/destroy`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form,
        signal: AbortSignal.timeout(15000),
      }
    );

    const data = (await res.json()) as {
      result?: string;
      error?: { message?: string };
    };
    const result = data.result;

    // "not found" counts as success — the asset is gone either way.
    if (result === 'ok' || result === 'not found') {
      return { success: true, message: `Cloudinary asset ${safePublicId} deleted.`, status: 200 };
    }
    return {
      success: false,
      message:
        data.error?.message ||
        (result
          ? `Cloudinary returned "${result}" for ${safePublicId}.`
          : `Cloudinary returned HTTP ${res.status} for ${safePublicId}.`),
      status: 502,
    };
  } catch (error: any) {
    console.error('deleteCloudinaryAsset: Cloudinary delete failed.', error);
    return { success: false, message: error?.message || 'Cloudinary deletion failed.', status: 500 };
  }
}