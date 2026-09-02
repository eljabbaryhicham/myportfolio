
'use server';
/**
 * @fileOverview A Genkit flow for permanently deleting a media asset from its Cloudinary library.
 *
 * Deleting from the website's media library only removes the Firestore metadata
 * document — the binary asset lives in Cloudinary and requires a signed,
 * server-side API call (the API secret must never reach the browser).
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeServerApp } from '@/firebase/server-init';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { SUPERADMIN_EMAIL } from '@/lib/constants';

// Input validation is intentionally lenient: media documents written by older
// versions of the app may carry unexpected `libraryId`/`resource_type` values
// or a missing `public_id`. Rejecting them at the flow boundary throws a
// schema error that surfaces to the client as "Minified React error #441"
// (an opaque Server Components render error). The handler normalizes the
// values instead, so no stored-data anomaly can crash the action.
const DeleteMediaInputSchema = z.object({
  publicId: z.string().optional(),
  resourceType: z.string().optional(),
  libraryId: z.string().optional(),
  idToken: z.string().optional(),
});
export type DeleteMediaInput = z.infer<typeof DeleteMediaInputSchema>;

const DeleteMediaOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type DeleteMediaOutput = z.infer<typeof DeleteMediaOutputSchema>;

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
 * Server-side wrapper around the delete flow.
 */
export async function deleteMediaAsset(
  input: DeleteMediaInput
): Promise<DeleteMediaOutput> {
    return await deleteMediaFlow(input);
}

const deleteMediaFlow = ai.defineFlow(
  {
    name: 'deleteMediaFlow',
    inputSchema: DeleteMediaInputSchema,
    outputSchema: DeleteMediaOutputSchema,
  },
  async ({ publicId, resourceType, libraryId, idToken }): Promise<DeleteMediaOutput> => {
    if (!(await canDeleteMedia(idToken))) {
      return { success: false, message: 'Unauthorized. You are not allowed to delete media.' };
    }

    // Normalize defensive values from legacy/anomalous documents instead of
    // rejecting them at the schema boundary (see DeleteMediaInputSchema).
    const safePublicId = publicId?.trim() ?? '';
    if (!safePublicId) {
      return { success: false, message: 'Missing Cloudinary public id; cannot delete this asset.' };
    }
    const safeResourceType = (['image', 'video', 'raw'].includes(resourceType ?? '')
      ? resourceType
      : 'image') as 'image' | 'video' | 'raw';
    const safeLibraryId = libraryId === 'extented' ? 'extented' : 'primary';

    const suffix = safeLibraryId === 'primary' ? '_1' : '_2';

    const cloudName = process.env[`CLOUDINARY_CLOUD_NAME${suffix}`];
    const apiKey = process.env[`CLOUDINARY_API_KEY${suffix}`];
    const apiSecret = process.env[`CLOUDINARY_API_SECRET${suffix}`];

    if (!cloudName || !apiKey || !apiSecret) {
      const errorMessage = `Cloudinary credentials for ${safeLibraryId} library are missing. Please check your .env file for CLOUDINARY_CLOUD_NAME${suffix}, CLOUDINARY_API_KEY${suffix}, and CLOUDINARY_API_SECRET${suffix}.`;
      console.error('Error in deleteMediaFlow:', errorMessage);
      return { success: false, message: errorMessage };
    }

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
        return { success: true, message: `Cloudinary asset ${safePublicId} deleted.` };
      }
      return { success: false, message: `Cloudinary returned "${result.result}" for ${safePublicId}.` };
    } catch (error: any) {
      console.error('Error in deleteMediaFlow:', error);
      return { success: false, message: error?.message || 'Cloudinary deletion failed.' };
    }
  }
);
