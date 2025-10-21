
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
  resource_type: z.enum(['image', 'video', 'raw']).optional(),
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
  async (input): Promise<UploadMediaFromUrlOutput> => {
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
          mediaId: undefined,
          resource_type: undefined,
        };
      }

      const cloudinary = (await import('cloudinary')).v2;
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
      });
      
      console.log(`Uploading from URL: ${input.mediaUrl}`);

      // 1. Upload to Cloudinary, identifying resource type and applying transformations
      const uploadResult = await cloudinary.uploader.upload(input.mediaUrl, {
        resource_type: 'auto', // Let Cloudinary detect the resource type
        eager_async: true,     // Perform transformations in the background
        eager: [
          // For videos, create an adaptive bitrate streaming profile
          { if: "resource_type:video",
            streaming_profile: "full_hd", format: "m3u8" },
        ]
      });

      console.log('Cloudinary upload successful:', uploadResult);

      let finalUrl = uploadResult.secure_url;
      // For videos, we need to find the HLS (.m3u8) manifest URL from the eager transformations
      if (uploadResult.resource_type === 'video') {
          // Cloudinary creates eager transformations. Find the HLS manifest URL.
          const hlsUrl = cloudinary.url(uploadResult.public_id, {
            resource_type: 'video',
            format: 'm3u8',
            streaming_profile: 'full_hd'
          });
          finalUrl = hlsUrl;
          console.log(`Generated HLS manifest URL: ${finalUrl}`);

      } else if (uploadResult.resource_type === 'image') {
          // Apply automatic optimization for images
          finalUrl = cloudinary.url(uploadResult.public_id, {
              fetch_format: 'auto',
              quality: 'auto',
              secure: true,
          });
          console.log(`Generated optimized image URL: ${finalUrl}`);
      }

      // 2. Initialize Firebase Admin SDK and save metadata to Firestore
      const serverApp = await initializeServerApp();
      const firestore = getAdminFirestore(serverApp);
      const filename = input.mediaUrl.substring(input.mediaUrl.lastIndexOf('/') + 1);

      const mediaData = {
        public_id: uploadResult.public_id,
        url: finalUrl, // Use the generated HLS or optimized image URL
        resource_type: uploadResult.resource_type,
        created_at: uploadResult.created_at,
        filename: filename || uploadResult.public_id,
      };

      const docRef = await firestore.collection('media').add(mediaData);

      console.log('Firestore document written with ID:', docRef.id);

      return {
        success: true,
        message: 'Media successfully added. Streaming profiles are being generated for video.',
        mediaId: docRef.id,
        resource_type: uploadResult.resource_type === 'video' ? 'video' : uploadResult.resource_type === 'raw' ? 'raw' : 'image',
      };
    } catch (error: any) {
      console.error('Error in uploadMediaFromUrlFlow:', error);

      let errorMessage = 'An unexpected error occurred.';
      if (error.http_code && error.message) {
        errorMessage = `Cloudinary error: ${error.message}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        message: errorMessage,
        mediaId: undefined,
        resource_type: undefined,
      };
    }
  }
);
