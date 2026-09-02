/**
 * `media_meta` Firestore collection contract.
 *
 * Cloudinary and Vercel Blob store their color tags on the media doc itself.
 * Appwrite and Gumlet assets do not live in Firestore, so their tags are kept
 * in this separate collection keyed by a deterministic composite id.
 */

export type MediaMetaProvider = 'appwrite' | 'gumlet_video' | 'gumlet_image';

export type MediaMetaTag = 'green' | 'red' | 'orange' | 'blue';

export interface MediaMetaDoc {
  provider: MediaMetaProvider;
  providerAssetId: string;
  tag: MediaMetaTag | null;
}

/** Deterministic, stable Firestore doc id for a provider asset's tag meta. */
export function mediaMetaDocId(provider: MediaMetaProvider, providerAssetId: string): string {
  return `${provider}__${providerAssetId}`;
}

export function isMediaMetaTag(value: unknown): value is MediaMetaTag {
  return value === 'green' || value === 'red' || value === 'orange' || value === 'blue';
}
