import { describe, expect, it } from 'vitest';
import { isMediaMetaTag, mediaMetaDocId } from './media-meta';

describe('media-meta', () => {
  it('builds a deterministic composite doc id', () => {
    expect(mediaMetaDocId('appwrite', 'file-1')).toBe('appwrite__file-1');
    expect(mediaMetaDocId('gumlet_video', 'asset-9')).toBe('gumlet_video__asset-9');
    expect(mediaMetaDocId('appwrite', 'file-1')).toBe(mediaMetaDocId('appwrite', 'file-1'));
  });

  it('recognizes only the four color tags', () => {
    expect(isMediaMetaTag('green')).toBe(true);
    expect(isMediaMetaTag('red')).toBe(true);
    expect(isMediaMetaTag('orange')).toBe(true);
    expect(isMediaMetaTag('blue')).toBe(true);
    expect(isMediaMetaTag('pink')).toBe(false);
    expect(isMediaMetaTag(null)).toBe(false);
  });
});
