import { createHmac, randomUUID } from 'crypto';

export const IMAGEKIT_MEDIA_COLLECTION = 'imagekit_media';

export interface ImageKitUploadAuth {
  publicKey: string;
  token: string;
  expire: number;
  signature: string;
}

export interface ImageKitMediaAsset {
  provider: 'imagekit';
  fileId: string;
  url: string;
  name: string;
  fileType: 'image' | 'video' | 'non-image';
  filePath?: string;
  thumbnailUrl?: string;
  size?: number;
  createdAt: string;
  tag?: 'green' | 'red' | 'orange' | 'blue';
}

function getImageKitConfig() {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
  if (!privateKey || !publicKey) {
    throw new Error('ImageKit is not configured. Set IMAGEKIT_PRIVATE_KEY and NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY.');
  }
  return { privateKey, publicKey };
}

export function createImageKitUploadAuth(): ImageKitUploadAuth {
  const { privateKey, publicKey } = getImageKitConfig();
  const token = randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 30 * 60;
  const signature = createHmac('sha1', privateKey)
    .update(`${token}${expire}`)
    .digest('hex');

  return { publicKey, token, expire, signature };
}

export async function deleteImageKitFile(fileId: string): Promise<void> {
  const { privateKey } = getImageKitConfig();
  const authorization = `Basic ${Buffer.from(`${privateKey}:`).toString('base64')}`;
  const response = await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: { Authorization: authorization },
  });

  if (response.ok) return;

  const body = await response.text().catch(() => '');
  throw new Error(body || `ImageKit delete failed with HTTP ${response.status}.`);
}
