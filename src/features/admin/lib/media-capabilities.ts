import type { MediaProvider, MediaResourceType } from '@/lib/media-providers';

/**
 * Declares what a media provider is capable of in the unified admin media
 * library. Each provider conforms to this model so the shared popup library
 * can render uniformly without hard-coding provider branches.
 */

/** Delivery/copy formats a provider can express from one stored asset. */
export type MediaFormatOption =
  | 'original'
  | 'mp4'
  | 'webm'
  | 'hls'
  | 'webp'
  | 'avif'
  | 'jpg'
  | 'png';

export interface CapabilityFormat {
  /** The short label shown in a format-choice menu. */
  key: MediaFormatOption;
  /** Default delivery URL for the asset (usually the original). */
  url: string;
}

export interface MediaCapabilities {
  provider: MediaProvider;
  /** Human label shown in tabs/menus. */
  label: string;
  /** Whether drag-&-drop / file-picker upload is supported. */
  canUploadFile: boolean;
  /** Whether importing a remote file by URL is supported. */
  canUploadByLink: boolean;
  /** The resource types this provider can store/render. */
  supportedTypes: MediaResourceType[];
  /** Whether primary/extended sub-libraries exist (Cloudinary only). */
  hasLibraries: boolean;
  /** Whether color tags are supported. */
  hasTags: boolean;
  /** Whether format-choice on selection is supported. */
  hasFormats: boolean;
  /** Whether bulk select/delete is supported. */
  hasBulkActions: boolean;
}

export const mediaCapabilities: Record<MediaProvider, MediaCapabilities> = {
  cloudinary: {
    provider: 'cloudinary',
    label: 'Cloudinary',
    canUploadFile: true,
    canUploadByLink: true,
    supportedTypes: ['image', 'video', 'raw'],
    hasLibraries: true,
    hasTags: true,
    hasFormats: true,
    hasBulkActions: true,
  },
  vercel_blob: {
    provider: 'vercel_blob',
    label: 'Vercel Blob',
    canUploadFile: true,
    canUploadByLink: true,
    supportedTypes: ['image', 'video', 'raw'],
    hasLibraries: false,
    hasTags: true,
    hasFormats: false,
    hasBulkActions: true,
  },
  appwrite: {
    provider: 'appwrite',
    label: 'Appwrite',
    canUploadFile: true,
    canUploadByLink: true,
    supportedTypes: ['image', 'video', 'raw'],
    hasLibraries: false,
    hasTags: true,
    hasFormats: false,
    hasBulkActions: true,
  },
  gumlet_video: {
    provider: 'gumlet_video',
    label: 'Gumlet Video',
    canUploadFile: true,
    canUploadByLink: true,
    supportedTypes: ['video'],
    hasLibraries: false,
    hasTags: true,
    hasFormats: true,
    hasBulkActions: false,
  },
  gumlet_image: {
    provider: 'gumlet_image',
    label: 'Gumlet Image',
    canUploadFile: false,
    canUploadByLink: true,
    supportedTypes: ['image'],
    hasLibraries: false,
    hasTags: true,
    hasFormats: true,
    hasBulkActions: false,
  },
  imagekit: {
    provider: 'imagekit',
    label: 'ImageKit',
    canUploadFile: true,
    canUploadByLink: true,
    supportedTypes: ['image', 'video', 'raw'],
    hasLibraries: false,
    hasTags: true,
    hasFormats: false,
    hasBulkActions: true,
  },
};

export function getMediaCapabilities(provider: MediaProvider): MediaCapabilities {
  return mediaCapabilities[provider];
}
