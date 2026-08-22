
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

const DeleteMediaInputSchema = z.object({
  publicId: z.string().min(1),
  resourceType: z.enum(['image', 'video', 'raw']),
  libraryId: z.enum(['primary', 'extented']),
});
export type DeleteMediaInput = z.infer<typeof DeleteMediaInputSchema>;

const DeleteMediaOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type DeleteMediaOutput = z.infer<typeof DeleteMediaOutputSchema>;

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
  async ({ publicId, resourceType, libraryId }): Promise<DeleteMediaOutput> => {
    const suffix = libraryId === 'primary' ? '_1' : '_2';

    const cloudName = process.env[`CLOUDINARY_CLOUD_NAME${suffix}`];
    const apiKey = process.env[`CLOUDINARY_API_KEY${suffix}`];
    const apiSecret = process.env[`CLOUDINARY_API_SECRET${suffix}`];

    if (!cloudName || !apiKey || !apiSecret) {
      const errorMessage = `Cloudinary credentials for ${libraryId} library are missing. Please check your .env file for CLOUDINARY_CLOUD_NAME${suffix}, CLOUDINARY_API_KEY${suffix}, and CLOUDINARY_API_SECRET${suffix}.`;
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
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true,
      });

      // "not found" counts as success — the asset is gone either way.
      if (result.result === 'ok' || result.result === 'not found') {
        return { success: true, message: `Cloudinary asset ${publicId} deleted.` };
      }
      return { success: false, message: `Cloudinary returned "${result.result}" for ${publicId}.` };
    } catch (error: any) {
      console.error('Error in deleteMediaFlow:', error);
      return { success: false, message: error?.message || 'Cloudinary deletion failed.' };
    }
  }
);
