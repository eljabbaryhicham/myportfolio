import { describe, expect, it } from 'vitest';
import {
  CLOUDINARY_LIBRARY_IDS,
  cloudinaryClientUploadEnv,
  cloudinaryEnvSuffix,
  isCloudinaryLibraryId,
} from './cloudinary-libraries';

describe('cloudinary-libraries', () => {
  it('exposes the three libraries in order', () => {
    expect(CLOUDINARY_LIBRARY_IDS).toEqual(['primary', 'extented', 'extented2']);
  });

  it('maps each library to its env suffix', () => {
    expect(cloudinaryEnvSuffix('primary')).toBe('1');
    expect(cloudinaryEnvSuffix('extented')).toBe('2');
    expect(cloudinaryEnvSuffix('extented2')).toBe('3');
  });

  it('recognizes valid library ids and rejects anything else', () => {
    expect(isCloudinaryLibraryId('primary')).toBe(true);
    expect(isCloudinaryLibraryId('extented')).toBe(true);
    expect(isCloudinaryLibraryId('extented2')).toBe(true);
    expect(isCloudinaryLibraryId('extented_2')).toBe(false);
    expect(isCloudinaryLibraryId('primary ')).toBe(false);
    expect(isCloudinaryLibraryId('')).toBe(false);
    expect(isCloudinaryLibraryId(undefined)).toBe(false);
  });

  it('reads the client upload env vars for each library', () => {
    const previous = {
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_3,
      uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_3,
    };
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_3 = 'cloud-three';
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_3 = 'preset-three';
    try {
      expect(cloudinaryClientUploadEnv('extented2')).toEqual({
        cloudName: 'cloud-three',
        uploadPreset: 'preset-three',
      });
    } finally {
      if (previous.cloudName === undefined) delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_3;
      else process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_3 = previous.cloudName;
      if (previous.uploadPreset === undefined) delete process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_3;
      else process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_3 = previous.uploadPreset;
    }
  });
});