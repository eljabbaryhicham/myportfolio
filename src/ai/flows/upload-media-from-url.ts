
'use server';
/**
 * @fileOverview A Genkit flow for uploading media from a URL to Cloudinary and saving to Firestore.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { initializeServerApp } from '@/firebase/server-init';

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
      if (
        !process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET
      ) {
        const errorMessage =
          'Cloudinary environment variables (CLOUD_NAME, API_KEY, API_SECRET) are not set. Please add them to your .env file.';
        console.error('Error in uploadMediaFromUrlFlow:', errorMessage);
        return {
          success: false,
          message: errorMessage,
        };
      }

      // --- IMPORTANT ---
      // Credentials are now read from environment variables for security.
      // Make sure to fill these out in your .env file.
      const cloudinary = (await import('cloudinary')).v2;
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
      });
      
      console.log(`Uploading from URL: ${input.mediaUrl}`);

      // 1. Upload to Cloudinary from the URL
      const uploadResult = await cloudinary.uploader.upload(input.mediaUrl, {
        resource_type: 'auto', // Automatically detect if it's an image or video
      });

      console.log('Cloudinary upload successful:', uploadResult);

      let finalUrl = uploadResult.secure_url;
      // Apply automatic optimization for images
      if (uploadResult.resource_type === 'image') {
        const urlParts = finalUrl.split('/upload/');
        if (urlParts.length === 2) {
            const transformations = 'f_auto,q_auto';
            finalUrl = `${urlParts[0]}/upload/${transformations}/${urlParts[1]}`;
        }
      }

      // 2. Initialize Firebase Admin SDK and save metadata to Firestore
      const serverApp = await initializeServerApp();
      const firestore = getAdminFirestore(serverApp);
      const filename = input.mediaUrl.substring(input.mediaUrl.lastIndexOf('/') + 1);

      const mediaData = {
        public_id: uploadResult.public_id,
        url: finalUrl, // Use the potentially modified URL
        resource_type: uploadResult.resource_type,
        created_at: uploadResult.created_at,
        filename: filename || uploadResult.public_id, // Use filename from URL or fallback to public_id
      };

      const docRef = await firestore.collection('media').add(mediaData);

      console.log('Firestore document written with ID:', docRef.id);

      return {
        success: true,
        message: 'Media successfully added from URL and optimized.',
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
