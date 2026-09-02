import { describe, expect, it } from 'vitest';
import { deleteMediaAsset } from './delete-media';

describe('deleteMediaAsset boundary hardening', () => {
  it('resolves (does not throw) when libraryId is out of the enum', async () => {
    // Regression: an unexpected libraryId previously failed Genkit's input
    // schema validation and the throw surfaced in production as
    // "Minified React error #441". The boundary must normalize instead.
    await expect(
      deleteMediaAsset({
        publicId: 'diag',
        resourceType: 'image',
        libraryId: 'extended' as any,
        idToken: 'bogus-token',
      })
    ).resolves.toEqual({
      success: false,
      message: 'Unauthorized. You are not allowed to delete media.',
    });
  });

  it('resolves (does not throw) when publicId is missing', async () => {
    const result = await deleteMediaAsset({
      publicId: '' as any,
      resourceType: 'video',
      libraryId: 'primary',
      idToken: 'bogus-token',
    });
    expect(result.success).toBe(false);
  });

  it('resolves (does not throw) when resourceType is unexpected', async () => {
    await expect(
      deleteMediaAsset({
        publicId: 'diag',
        resourceType: 'auto' as any,
        libraryId: 'primary',
        idToken: 'bogus-token',
      })
    ).resolves.toEqual({
      success: false,
      message: 'Unauthorized. You are not allowed to delete media.',
    });
  });
});