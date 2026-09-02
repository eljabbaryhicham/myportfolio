import { describe, expect, it } from 'vitest';
import { normalizeGumletAsset } from './gumlet-video';

describe('Gumlet asset normalization', () => {
  it('normalizes direct-upload API fields for the admin library', () => {
    expect(normalizeGumletAsset({
      asset_id: 'asset-1', status: 'ready', input: { title: 'Showreel' },
      output: { format: 'hls', playback_url: 'https://video.gumlet.io/main.m3u8', thumbnail_url: ['https://video.gumlet.io/thumb.png'] },
    })).toEqual({
      assetId: 'asset-1', title: 'Showreel', status: 'ready', format: 'hls',
      playbackUrl: 'https://video.gumlet.io/main.m3u8', thumbnailUrl: 'https://video.gumlet.io/thumb.png', createdAt: undefined,
    });
  });
});
