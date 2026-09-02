import { getGumletImageConfiguration } from '@/lib/media-server-config';

export interface GumletImageRecord {
  id: string;
  sourceUrl: string;
  deliveryUrl: string;
  filename: string;
  createdAt?: string;
}

function config() {
  const result = getGumletImageConfiguration();
  if (!result.configured) throw new Error(`Gumlet Image is not configured. Missing: ${result.missing.join(', ')}.`);
  return result.value;
}

export function isAllowedGumletImageOrigin(host: string, allowedHosts: string[]) {
  const normalized = host.toLowerCase();
  return allowedHosts.some((allowed) => normalized === allowed || normalized.endsWith(`.${allowed}`));
}

export function gumletImageDeliveryUrl(sourceUrl: string) {
  const { sourceHost, allowedOriginHosts } = config();
  const source = new URL(sourceUrl);
  if (source.protocol !== 'https:' || !isAllowedGumletImageOrigin(source.hostname, allowedOriginHosts)) {
    throw new Error('Image URL must use HTTPS and belong to a configured Gumlet image origin.');
  }
  const output = new URL(`https://${sourceHost}${source.pathname}`);
  source.searchParams.forEach((value, key) => output.searchParams.set(key, value));
  output.searchParams.set('format', 'auto');
  return output.toString();
}

/**
 * Gumlet delivery URL for a specific output format. Replaces the default
 * `format=auto` used by `gumletImageDeliveryUrl` so admins can copy e.g. a
 * WebP/AVIF variant. Pass the URL produced by `gumletImageDeliveryUrl`.
 */
export function gumletImageDeliveryFormatUrl(deliveryUrl: string, format: 'webp' | 'avif' | 'jpg' | 'png' | 'auto') {
  const output = new URL(deliveryUrl);
  output.searchParams.set('format', format);
  return output.toString();
}

export function gumletImageFilename(sourceUrl: string) {
  return decodeURIComponent(new URL(sourceUrl).pathname.split('/').pop() || 'image');
}
