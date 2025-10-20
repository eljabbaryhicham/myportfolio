
'use server';
/**
 * @fileOverview A Genkit flow for uploading media from a URL to Cloudinary and saving to Firestore.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { collection, addDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

const UploadMediaFromUrlInputSchema = z.object({
  mediaUrl: z.string().url(),
});
export type UploadMediaFromUrlInput = z.infer<typeof UploadMediaFromUrlInputSchema>;

const UploadMediaFromUrlOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  mediaId: z.string().optional(),
  resource_type: z.enum(['image', 'video']).optional(),
});
export type UploadMediaFromUrlOutput = z.infer<typeof UploadMediaFromUrlOutputSchema>;

/**
 * A server-side function to handle the upload process.
 * This is a wrapper around the Genkit flow.
 * @param input The media URL.
 * @returns A promise that resolves with the result of the upload.
 */
export async function uploadMediaFromUrl(
  input: UploadMediaFromUrlInput
): Promise<UploadMediaFromUrlOutput> {
    // If all checks pass, proceed with the flow
    return await uploadMediaFromUrlFlow(input);
}


/**
 * A Genkit flow that uploads a file from a URL to Cloudinary,
 * then creates a corresponding document in Firestore.
 */
const uploadMediaFromUrlFlow = ai.defineFlow(
  {
    name: 'uploadMediaFromUrlFlow',
    inputSchema: UploadMediaFromUrlInputSchema,
    outputSchema: UploadMediaFromUrlOutputSchema,
  },
  async (input) => {
    try {
      // --- IMPORTANT ---
      // The credentials below are hardcoded to ensure functionality.
      // For a production environment, you MUST move these to a secure
      // environment variable management system (e.g., Vercel Environment Variables, Google Secret Manager).
      const cloudinary = (await import('cloudinary')).v2;
      cloudinary.config({
        cloud_name: 'da1srnoer', 
        api_key: '776638649259813', 
        api_secret: 'kzvIhKcsX6V3xNcPdQjq4ZEcbus',
        secure: true
      });
      
      console.log(`Uploading from URL: ${input.mediaUrl}`);

      // 1. Upload to Cloudinary from the URL
      const uploadResult = await cloudinary.uploader.upload(input.mediaUrl, {
        resource_type: 'auto', // Automatically detect if it's an image or video
      });

      console.log('Cloudinary upload successful:', uploadResult);

      // 2. Save metadata to Firestore
      const { firestore } = initializeFirebase();
      const filename = input.mediaUrl.substring(input.mediaUrl.lastIndexOf('/') + 1);

      const mediaData = {
        public_id: uploadResult.public_id,
        url: uploadResult.secure_url,
        resource_type: uploadResult.resource_type,
        created_at: uploadResult.created_at,
        filename: filename || uploadResult.public_id, // Use filename from URL or fallback to public_id
      };

      const docRef = await addDoc(collection(firestore, 'media'), mediaData);

      console.log('Firestore document written with ID:', docRef.id);

      return {
        success: true,
        message: 'Media successfully added from URL.',
        mediaId: docRef.id,
        resource_type: uploadResult.resource_type === 'video' ? 'video' : 'image',
      };
    } catch (error: any) {
      console.error('Error in uploadMediaFromUrlFlow:', error);

      // Determine if it's a Cloudinary error or another type
      let errorMessage = 'An unexpected error occurred.';
      if (error.http_code && error.message) {
        // This looks like a Cloudinary API error
        errorMessage = `Cloudinary error: ${error.message}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  }
);
