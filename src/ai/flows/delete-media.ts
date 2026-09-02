
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
import { deleteCloudinaryAsset } from '@/lib/cloudinary-delete';

// Input validation is intentionally lenient: media documents written by older
// versions of the app may carry unexpected `libraryId`/`resource_type` values
// or a missing `public_id`. Rejecting them at the flow boundary throws a
// schema error that surfaces to the client as "Minified React error #441"
// (an opaque Server Components render error). The shared helper normalizes
// the values instead, so no stored-data anomaly can crash the action.
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
    const result = await deleteCloudinaryAsset({ publicId, resourceType, libraryId, idToken });
    return { success: result.success, message: result.message };
  }
);
