import { describe, expect, it, vi } from 'vitest';
import { deleteMediaAsset } from './delete-media';

// Hermetic test: mock the Cloudinary helper so these boundary tests never hit
// live Firebase auth or the network. (Otherwise the first firebase-admin
// verifyIdToken fetches Google's certificates over HTTPS, which can take
// longer than the test timeout in CI.) The mock returns the same result the
// real helper produces for a bogus token, so the assertions are unchanged.
// The regression these tests guard — Genkit's input schema must never reject
// legacy/anomalous input — still fails loudly here, because that throw happens
// inside the flow's schema validation before the helper is ever called.
vi.mock('@/lib/cloudinary-delete', () => ({
  deleteCloudinaryAsset: vi.fn(async () => ({
    success: false,
    message: 'Unauthorized. You are not allowed to delete media.',
    status: 403,
  })),
}));

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