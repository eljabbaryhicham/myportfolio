/**
 * Provider-neutral media contracts for the admin dashboard.
 *
 * These types deliberately live outside the existing Cloudinary and Vercel
 * Blob implementations. New provider modules can depend on this contract
 * without changing either legacy upload flow.
 */

export const mediaProviders = [
  'cloudinary',
  'vercel_blob',
  'appwrite',
  'gumlet_video',
  'gumlet_image',
  'imagekit',
] as const;

export type MediaProvider = (typeof mediaProviders)[number];

export type MediaResourceType = 'image' | 'video' | 'raw';

export type ManagedMediaProvider = Exclude<MediaProvider, 'cloudinary' | 'vercel_blob'>;

export interface ProviderAssetRecord {
  /** The provider that owns the remote asset. */
  provider: ManagedMediaProvider;
  /** Provider-native immutable asset/file identifier. */
  providerAssetId: string;
  /** URL used by the public site or media picker. */
  url: string;
  filename: string;
  resourceType: MediaResourceType;
  contentType?: string;
  size?: number;
  createdAt?: string;
  /** Provider-specific, non-secret metadata such as a Gumlet processing state. */
  metadata?: Record<string, string | number | boolean | null>;
}

export const providerLabels: Record<MediaProvider, string> = {
  cloudinary: 'Cloudinary',
  vercel_blob: 'Vercel Blob',
  appwrite: 'Appwrite',
  gumlet_video: 'Gumlet Video',
  gumlet_image: 'Gumlet Image',
  imagekit: 'ImageKit',
};
