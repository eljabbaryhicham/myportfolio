import { describe, expect, it } from 'vitest';
import {
  getAppwriteMediaConfiguration,
  getGumletImageConfiguration,
  getGumletVideoConfiguration,
} from './media-server-config';

describe('media provider server configuration', () => {
  it('does not report Appwrite as configured without all server-side values', () => {
    expect(getAppwriteMediaConfiguration({ APPWRITE_ENDPOINT: 'https://fra.cloud.appwrite.io/v1' })).toEqual({
      configured: false,
      missing: ['APPWRITE_PROJECT_ID', 'APPWRITE_MEDIA_BUCKET_ID', 'APPWRITE_API_KEY'],
    });
  });

  it('accepts a complete Appwrite configuration and normalizes its endpoint', () => {
    expect(getAppwriteMediaConfiguration({
      APPWRITE_ENDPOINT: 'https://fra.cloud.appwrite.io/v1/',
      APPWRITE_PROJECT_ID: 'project-id',
      APPWRITE_MEDIA_BUCKET_ID: 'media',
      APPWRITE_API_KEY: 'secret',
    })).toMatchObject({
      configured: true,
      value: { endpoint: 'https://fra.cloud.appwrite.io/v1', projectId: 'project-id', bucketId: 'media' },
    });
  });

  it('requires Gumlet video credentials and an explicit image-source allow-list', () => {
    expect(getGumletVideoConfiguration({ GUMLET_API_KEY: 'secret' })).toEqual({
      configured: false,
      missing: ['GUMLET_VIDEO_WORKSPACE_ID'],
    });
    expect(getGumletImageConfiguration({
      GUMLET_IMAGE_SOURCE_HOST: 'images.example.gumlet.io',
      GUMLET_IMAGE_ALLOWED_ORIGINS: 'media.example.com,cdn.example.com',
    })).toEqual({
      configured: true,
      value: {
        sourceHost: 'images.example.gumlet.io',
        allowedOriginHosts: ['media.example.com', 'cdn.example.com'],
      },
    });
  });
});
