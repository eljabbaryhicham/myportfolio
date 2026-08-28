
'use server';
/**
 * @fileOverview A Genkit flow for uploading media from a URL to a specified Cloudinary library.
 * Only the Cloudinary transfer happens server-side; the caller (browser) writes the
 * Firestore document via the client SDK, so no Firebase Admin credentials are needed.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeServerApp } from '@/firebase/server-init';
import admin from 'firebase-admin';
import { SUPERADMIN_EMAIL } from '@/lib/constants';
import { isInternalUrl } from '@/lib/ssrf';

const UploadMediaFromUrlInputSchema = z.object({
  mediaUrl: z.string().url(),
  libraryId: z.enum(['primary', 'extented']),
  videoFormat: z.enum(['mp4', 'm3u8', 'webm']).optional(),
  idToken: z.string().optional(),
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

// Only an authenticated superadmin (or a user with the upload permission) may
// fetch/upload from an arbitrary URL. Denies closed on any failure.
async function canUploadFromUrl(idToken?: string): Promise<boolean> {
  if (!idToken) return false;
  try {
    const app = await initializeServerApp();
    const decoded = await admin.auth(app).verifyIdToken(idToken);
    if (decoded.email === SUPERADMIN_EMAIL) return true;
    const snap = await admin.firestore(app).collection('users').doc(decoded.uid).get();
    if (snap.exists) {
      const data = snap.data() as any;
      if (data?.permissions?.canUploadMedia === true) return true;
    }
    return false;
  } catch {
    return false;
  }
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

      if (!(await canUploadFromUrl(input.idToken))) {
        return { success: false, message: 'Unauthorized. You are not allowed to upload media.', media: undefined };
      }
      if (isInternalUrl(input.mediaUrl)) {
        return { success: false, message: 'Blocked: this URL points to an internal or private host.', media: undefined };
      }

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

      // Fetch the remote file with browser-like headers and handle JS cookie challenges
      // (e.g., board.jdownloader.org returns a 203-byte HTML challenge for generic fetch)
      let mediaBuffer: Buffer | null = null;
      let contentType: string | null = null;
      try {
        const fetchWithHeaders = (u: string, extraHeaders: Record<string, string> = {}) =>
          fetch(u, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
              ...extraHeaders,
            },
            redirect: 'follow',
          });
        let res = await fetchWithHeaders(input.mediaUrl);
        let buffer = Buffer.from(await res.arrayBuffer());
        contentType = res.headers.get('content-type');

        const textSnippet = buffer.length < 2048 ? buffer.toString('utf-8', 0, Math.min(buffer.length, 2048)) : '';
        if (contentType?.includes('text/html') && textSnippet.includes('firstvisit')) {
          res = await fetchWithHeaders(input.mediaUrl, { Cookie: 'firstvisit=Max' });
          if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
          contentType = res.headers.get('content-type');
          buffer = Buffer.from(await res.arrayBuffer());
        }

        // If we got an image buffer (or the URL ends with an image extension), keep it for direct upload
        const lowerUrl = input.mediaUrl.toLowerCase();
        const isImageExt = /\.(png|jpe?g|gif|webp|avif|svg|bmp|tiff)$/.test(lowerUrl.split('?')[0]);
        if ((contentType && contentType.startsWith('image/')) || (isImageExt && buffer.length > 1000 && !contentType?.includes('text/html'))) {
          mediaBuffer = buffer;
          if (isImageExt && contentType?.includes('text/html')) {
            const ext = lowerUrl.split('.').pop()?.split('?')[0] || 'png';
            const mimeMap: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif', svg: 'image/svg+xml', bmp: 'image/bmp' };
            contentType = mimeMap[ext] || 'image/png';
          }
        } else if (contentType?.includes('text/html') && buffer.length < 5000) {
          // Still got HTML — likely a challenge page, fall back to letting Cloudinary fetch directly (it may handle it)
          mediaBuffer = null;
        } else {
          mediaBuffer = buffer;
        }
      } catch (fetchErr) {
        console.warn('Pre-fetch for Cloudinary URL failed, falling back to direct Cloudinary fetch', fetchErr);
        mediaBuffer = null;
      }

      // Upload to Cloudinary — use buffer if we successfully fetched it, otherwise let Cloudinary fetch the URL
      let uploadResult: any;
      if (mediaBuffer) {
        const dataUri = `data:${contentType || 'image/png'};base64,${mediaBuffer.toString('base64')}`;
        uploadResult = await cloudinary.uploader.upload(dataUri, {
          resource_type: 'auto',
        });
      } else {
        uploadResult = await cloudinary.uploader.upload(input.mediaUrl, {
          resource_type: 'auto',
        });
      }

      console.log('Cloudinary upload successful:', uploadResult.public_id);

      let finalUrl = uploadResult.secure_url;

      if (uploadResult.resource_type === 'video' && videoFormat === 'm3u8') {
          finalUrl = `https://res.cloudinary.com/${cloudName}/video/upload/sp_auto/v${uploadResult.version}/${uploadResult.public_id}.m3u8`;
          console.log(`Generated adaptive streaming (HLS) URL: ${finalUrl}`);
      } else if (uploadResult.resource_type === 'video' && videoFormat === 'webm') {
          // Keep the original extension — Cloudinary video delivery URLs require one.
          finalUrl = finalUrl.replace('/upload/', '/upload/f_webm,q_auto/');
          console.log(`Generated WebM URL: ${finalUrl}`);
      } else if (uploadResult.resource_type === 'image' || uploadResult.resource_type === 'video') {
          // Same transformation style as direct uploads: preserves the file extension
          // so the delivered asset keeps a playable format (.mp4/.jpg/...).
          finalUrl = finalUrl.replace('/upload/', '/upload/f_auto,q_auto/');
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
