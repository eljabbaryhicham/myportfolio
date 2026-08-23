
'use server';
/**
 * @fileOverview A Genkit flow for uploading media from a URL to a specified Cloudinary library.
 * Only the Cloudinary transfer happens server-side; the caller (browser) writes the
 * Firestore document via the client SDK, so no Firebase Admin credentials are needed.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const UploadMediaFromUrlInputSchema = z.object({
  mediaUrl: z.string().url(),
  libraryId: z.enum(['primary', 'extented']),
  videoFormat: z.enum(['mp4', 'm3u8', 'webm']).optional(),
});
export type UploadMediaFromUrlInput = z.infer<typeof UploadMediaFromUrlInputSchema>;

const UploadedMediaSchema = z.object({
  public_id: z.string(),
  url: z.string(),
  resource_type: z.enum(['image', 'video', 'raw']),
  created_at: z.string(),
  filename: z.string(),
  libraryId: z.enum(['primary', 'extented']),
  videoFormat: z.enum(['mp4', 'm3u8', 'webm']).optional(),
});

const UploadMediaFromUrlOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  media: UploadedMediaSchema.optional(),
});
export type UploadMediaFromUrlOutput = z.infer<typeof UploadMediaFromUrlOutputSchema>;

/**
 * A server-side function to handle the upload process.
 * This is a wrapper around the Genkit flow.
 * @param input The media URL and library ID.
 * @returns A promise that resolves with the result of the upload.
 */
export async function uploadMediaFromUrl(
  input: UploadMediaFromUrlInput
): Promise<UploadMediaFromUrlOutput> {
    // If all checks pass, proceed with the flow
    return await uploadMediaFromUrlFlow(input);
}


/**
 * A Genkit flow that uploads a file from a URL to a specific Cloudinary library.
 */
const uploadMediaFromUrlFlow = ai.defineFlow(
  {
    name: 'uploadMediaFromUrlFlow',
    inputSchema: UploadMediaFromUrlInputSchema,
    outputSchema: UploadMediaFromUrlOutputSchema,
  },
  async (input): Promise<UploadMediaFromUrlOutput> => {
    try {
      const { libraryId, videoFormat } = input;
      const suffix = libraryId === 'primary' ? '_1' : '_2';

      const cloudName = process.env[`CLOUDINARY_CLOUD_NAME${suffix}`];
      const apiKey = process.env[`CLOUDINARY_API_KEY${suffix}`];
      const apiSecret = process.env[`CLOUDINARY_API_SECRET${suffix}`];

      if (!cloudName || !apiKey || !apiSecret) {
        const errorMessage = `Cloudinary credentials for ${libraryId} library are missing. Please check your .env file for CLOUDINARY_CLOUD_NAME${suffix}, CLOUDINARY_API_KEY${suffix}, and CLOUDINARY_API_SECRET${suffix}.`;
        console.error('Error in uploadMediaFromUrlFlow:', errorMessage);
        return {
          success: false,
          message: errorMessage,
          media: undefined,
        };
      }

      const cloudinary = (await import('cloudinary')).v2;
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true
      });

      console.log(`Uploading to ${libraryId} library from URL: ${input.mediaUrl}`);

      // Upload to Cloudinary.
      const uploadResult = await cloudinary.uploader.upload(input.mediaUrl, {
        resource_type: 'auto', // Let Cloudinary detect the resource type
      });

      console.log('Cloudinary upload successful:', uploadResult.public_id);

      let finalUrl = uploadResult.secure_url;

      if (uploadResult.resource_type === 'video' && videoFormat === 'm3u8') {
          finalUrl = `https://res.cloudinary.com/${cloudName}/video/upload/sp_auto/v${uploadResult.version}/${uploadResult.public_id}.m3u8`;
          console.log(`Generated adaptive streaming (HLS) URL: ${finalUrl}`);
      } else if (uploadResult.resource_type === 'video' && videoFormat === 'webm') {
          finalUrl = cloudinary.url(uploadResult.public_id, {
              format: 'webm',
              quality: 'auto',
              secure: true,
              resource_type: 'video',
          });
          console.log(`Generated WebM URL: ${finalUrl}`);
      } else if (uploadResult.resource_type === 'image' || uploadResult.resource_type === 'video') {
          finalUrl = cloudinary.url(uploadResult.public_id, {
              fetch_format: 'auto',
              quality: 'auto',
              secure: true,
              resource_type: uploadResult.resource_type,
          });
          console.log(`Generated optimized ${uploadResult.resource_type} URL: ${finalUrl}`);
      }

      const filename = input.mediaUrl.substring(input.mediaUrl.lastIndexOf('/') + 1);

      return {
        success: true,
        message: 'Media successfully uploaded to Cloudinary.',
        media: {
          public_id: uploadResult.public_id,
          url: finalUrl,
          resource_type: uploadResult.resource_type as 'image' | 'video' | 'raw',
          created_at: String(uploadResult.created_at),
          filename: filename || uploadResult.public_id,
          libraryId: libraryId,
          ...(uploadResult.resource_type === 'video' && { videoFormat: videoFormat || 'mp4' }),
        },
      };
    } catch (error: any) {
      console.error('Error in uploadMediaFromUrlFlow:', error);

      let errorMessage = 'An unexpected error occurred.';
      if (error.http_code === 400 && error.message && error.message.includes('File size too large')) {
          errorMessage = 'The provided file is too large. Cloudinary\'s free plan limit is 100MB. Please use a smaller file.';
      } else if (error.http_code && error.message) {
        errorMessage = `Cloudinary error: ${error.message}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        message: errorMessage,
        media: undefined,
      };
    }
  }
);
