import { describe, expect, it } from 'vitest';
import { appwriteResourceType, appwriteViewUrl } from './appwrite-storage';

describe('Appwrite media helpers', () => {
  const config = {
    endpoint: 'https://fra.cloud.appwrite.io/v1',
    projectId: 'project-id',
    bucketId: 'public-media',
  };

  it('creates a public view URL without server credentials', () => {
    expect(appwriteViewUrl(config, 'image-id')).toBe(
      'https://fra.cloud.appwrite.io/v1/storage/buckets/public-media/files/image-id/view?project=project-id'
    );
  });

  it('maps image, video, and all remaining MIME types to library tabs', () => {
    expect(appwriteResourceType('image/avif')).toBe('image');
    expect(appwriteResourceType('video/mp4')).toBe('video');
    expect(appwriteResourceType('application/pdf')).toBe('raw');
  });
});
