import { describe, expect, it } from 'vitest';
import { toMediaLibraryAsset } from './media-asset';

describe('toMediaLibraryAsset', () => {
  it('maps a Cloudinary asset shape', () => {
    expect(toMediaLibraryAsset('cloudinary', {
      id: 'doc-1',
      url: 'https://res.cloudinary.com/x/image/upload/v1/a.png',
      public_id: 'a',
      resource_type: 'image',
      created_at: '2024-01-01',
      filename: 'a.png',
      libraryId: 'extented',
      videoFormat: 'mp4',
      tag: 'blue',
    })).toEqual({
      id: 'doc-1',
      provider: 'cloudinary',
      url: 'https://res.cloudinary.com/x/image/upload/v1/a.png',
      filename: 'a.png',
      resourceType: 'image',
      createdAt: '2024-01-01',
      subLibraryId: 'extented',
      videoFormat: 'mp4',
      tag: 'blue',
    });
  });

  it('maps a Vercel Blob shape', () => {
    expect(toMediaLibraryAsset('vercel_blob', {
      id: 'blob-1',
      url: 'https://x.blob.vercel-storage.com/a.png',
      pathname: '/a.png',
      size: 10,
      contentType: 'image/png',
      filename: 'a.png',
      uploadedAt: '2024-01-01',
      tag: 'red',
    })).toEqual({
      id: 'blob-1',
      provider: 'vercel_blob',
      url: 'https://x.blob.vercel-storage.com/a.png',
      filename: 'a.png',
      resourceType: 'image',
      contentType: 'image/png',
      size: 10,
      createdAt: '2024-01-01',
      tag: 'red',
    });
  });

  it('maps a ProviderAssetRecord shape', () => {
    expect(toMediaLibraryAsset('appwrite', {
      provider: 'appwrite',
      providerAssetId: 'file-1',
      url: 'https://appwrite/view',
      filename: 'a.png',
      resourceType: 'image',
      contentType: 'image/png',
      size: 5,
    })).toEqual({
      id: 'file-1',
      provider: 'appwrite',
      url: 'https://appwrite/view',
      filename: 'a.png',
      resourceType: 'image',
      contentType: 'image/png',
      size: 5,
      title: 'a.png',
    });
  });
});
