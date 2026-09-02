import { getGumletVideoConfiguration } from '@/lib/media-server-config';

export type GumletOutputFormat = 'ABR' | 'MP4';

export interface GumletVideoAsset {
  assetId: string;
  title: string;
  status: string;
  playbackUrl?: string;
  thumbnailUrl?: string;
  createdAt?: string;
  format?: string;
}

export interface GumletUploadIntent extends GumletVideoAsset {
  uploadUrl: string;
}

const API_ROOT = 'https://api.gumlet.com/v1';

function gumletConfiguration() {
  const result = getGumletVideoConfiguration();
  if (!result.configured) {
    throw new Error(`Gumlet Video is not configured. Missing: ${result.missing.join(', ')}.`);
  }
  return result.value;
}

async function gumletFetch(path: string, init: RequestInit = {}) {
  const config = gumletConfiguration();
  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
    signal: AbortSignal.timeout(15_000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || data?.error?.message || `Gumlet API request failed (${response.status}).`);
  }
  return data;
}

export function normalizeGumletAsset(raw: any): GumletVideoAsset {
  const output = raw.output ?? {};
  return {
    assetId: raw.asset_id ?? raw.id,
    title: raw.title ?? raw.input?.title ?? 'Untitled video',
    status: raw.status ?? output.status ?? 'unknown',
    playbackUrl: output.playback_url ?? raw.playback_url,
    thumbnailUrl: Array.isArray(output.thumbnail_url) ? output.thumbnail_url[0] : output.thumbnail_url ?? raw.thumbnail_url,
    createdAt: raw.created_at ?? raw.$createdAt,
    format: output.format ?? raw.format,
  };
}

export async function createGumletUploadIntent(title: string, format: GumletOutputFormat): Promise<GumletUploadIntent> {
  const config = gumletConfiguration();
  const data = await gumletFetch('/video/assets/upload', {
    method: 'POST',
    body: JSON.stringify({ collection_id: config.workspaceId, title, format }),
  });
  if (!data.upload_url || !(data.asset_id ?? data.id)) {
    throw new Error('Gumlet did not return a direct-upload URL.');
  }
  return { ...normalizeGumletAsset(data), uploadUrl: data.upload_url };
}

export async function listGumletAssets(search?: string): Promise<GumletVideoAsset[]> {
  const config = gumletConfiguration();
  const query = new URLSearchParams({ type: 'videos', size: '100', sortBy: 'created_at', orderBy: 'desc' });
  if (search?.trim()) query.set('title', search.trim().slice(0, 256));
  const data = await gumletFetch(`/video/workspaces/${encodeURIComponent(config.workspaceId)}/list?${query}`);
  const assets = data.all_assets ?? data.assets ?? data.videos ?? [];
  return assets.map(normalizeGumletAsset).filter((asset: GumletVideoAsset) => Boolean(asset.assetId));
}

export async function deleteGumletAsset(assetId: string): Promise<void> {
  await gumletFetch(`/video/assets/${encodeURIComponent(assetId)}`, { method: 'DELETE' });
}
