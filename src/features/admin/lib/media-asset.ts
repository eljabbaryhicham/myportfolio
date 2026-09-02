import type { ProviderAssetRecord } from '@/lib/media-providers';

/** Color tag shared across providers (mirrors the Cloudinary tag set). */
export type MediaColorTag = 'green' | 'red' | 'orange' | 'blue';

/** The resource types a stored asset can be. */
export type MediaLibraryResourceType = 'image' | 'video' | 'raw';

/**
 * Provider-neutral asset shape used by the unified media library and its
 * shared UI. Every provider maps its native asset into this shape.
 */
export interface MediaLibraryAsset {
  /** Provider-native immutable identifier (public_id, blob id, file id...). */
  id: string;
  provider: string;
  url: string;
  filename: string;
  resourceType: MediaLibraryResourceType;
  contentType?: string;
  size?: number;
  createdAt?: string;
  /** Provider-specific identifier used to delete/copy the asset server-side. */
  providerAssetKey?: string;
  subLibraryId?: string;
  videoFormat?: string;
  title?: string;
  tag?: MediaColorTag;
}

/** Minimal Cloudinary-shaped subset needed to map without importing UI types. */
interface CloudinaryAssetLike {
  id: string;
  url: string;
  public_id: string;
  resource_type: MediaLibraryResourceType;
  created_at: string;
  filename: string;
  libraryId?: 'primary' | 'extented' | string;
  videoFormat?: string;
  title?: string;
  tag?: MediaColorTag;
}

interface VercelBlobLike {
  id: string;
  url: string;
  pathname: string;
  size?: number;
  contentType?: string;
  filename: string;
  uploadedAt?: string;
  tag?: MediaColorTag;
}

const toResourceType = (
  t: unknown
): MediaLibraryResourceType => (t === 'image' || t === 'video' || t === 'raw' ? t : 'image');

export function toMediaLibraryAsset(
  provider: string,
  native: CloudinaryAssetLike | VercelBlobLike | ProviderAssetRecord
): MediaLibraryAsset {
  const anyNative = native as unknown as Record<string, unknown>;
  const tag = anyNative.tag as MediaColorTag | undefined;

  if (anyNative.providerAssetId !== undefined && anyNative.provider !== undefined) {
    const rec = native as ProviderAssetRecord;
    return {
      id: rec.providerAssetId,
      provider: rec.provider,
      url: rec.url,
      filename: rec.filename,
      resourceType: rec.resourceType,
      contentType: rec.contentType,
      size: rec.size,
      createdAt: rec.createdAt,
      title: rec.filename,
      tag,
    };
  }

  if (anyNative.public_id !== undefined) {
    const c = native as unknown as CloudinaryAssetLike;
    return {
      id: c.id,
      provider,
      url: c.url,
      filename: c.filename,
      resourceType: toResourceType(c.resource_type),
      createdAt: c.created_at,
      subLibraryId: c.libraryId,
      videoFormat: c.videoFormat,
      title: c.title,
      tag: c.tag,
    };
  }

  const b = native as unknown as VercelBlobLike;
  return {
    id: b.id,
    provider,
    url: b.url,
    filename: b.filename,
    resourceType: 'image',
    contentType: b.contentType,
    size: b.size,
    createdAt: b.uploadedAt,
    tag: b.tag,
  };
}
