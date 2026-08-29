
/**
 * Cloudinary can generate a preview-thumbnail sprite + WebVTT index on demand
 * for any video asset by adding the `fl_sprite` flag to its delivery URL and
 * requesting the `.vtt` format. Plyr's `previewThumbnails` consumes that VTT
 * (each cue maps a time range to an `#xywh=` rectangle of the auto-generated
 * sprite image).
 *
 * Given a Cloudinary video deliver URL of the form
 *   https://res.cloudinary.com/<cloud>/video/upload/<transforms>/v<version>/<public_id>.<ext>
 * this returns the equivalent sprite-VTT URL:
 *   https://res.cloudinary.com/<cloud>/video/upload/fl_sprite/v<version>/<public_id>.vtt
 *
 * Returns null when the source is not a Cloudinary video deliver URL (e.g.
 * YouTube/Vimeo embeds or Vercel Blob URLs), so callers can fall back to
 * manual VTT entry.
 */
export function deriveCloudinarySpriteVtt(sourceUrl: string | null | undefined): string | null {
  if (!sourceUrl) return null;

  let url: URL;
  try {
    url = new URL(sourceUrl);
  } catch {
    return null;
  }

  // Only Cloudinary `res.cloudinary.com` deliver URLs are supported.
  // (A custom CNAME could appear here too, but we keep to the default host.)
  if (!url.hostname.endsWith('res.cloudinary.com')) return null;

  // Expected path: /<cloud>/<resource_type>/<delivery_type>/<transformations>/<version>/<public_id>.<ext>
  // e.g. /demo/video/upload/sp_auto/v123/abc.m3u8
  const parts = url.pathname.split('/').filter(Boolean);
  // Need at least: cloud(1) resource_type(2) delivery_type(3) + public_id token
  if (parts.length < 4) return null;

  const [cloud, resourceType, deliveryType, ...rest] = parts;
  if (resourceType !== 'video' || deliveryType !== 'upload') return null;

  // The final segment holds <public_id>.<ext> (public_id itself may contain dots).
  const last = rest[rest.length - 1] ?? '';
  const dotIndex = last.lastIndexOf('.');
  const publicId = dotIndex === -1 ? last : last.slice(0, dotIndex);
  if (!publicId) return null;

  // Everything between delivery type and the version/public-id token are
  // transformations; we replace them with just `fl_sprite`. When there is no
  // explicit `/v<version>/` we keep the tokens as-is (version token optional).
  const versionIdx = rest.findIndex((seg) => /^v\d+$/.test(seg));
  const versionPart = versionIdx >= 0 ? rest[versionIdx] : '';

  // Rebuild with a single `fl_sprite` flag and the `.vtt` extension.
  const transformPart = 'fl_sprite';
  const versionPath = versionPart ? `/${versionPart}` : '';
  const encodedPublicId = publicId.split('/').map(encodeURIComponent).join('/');
  const search = url.search ? url.search : '';

  return `https://res.cloudinary.com/${cloud}/video/upload/${transformPart}${versionPath}/${encodedPublicId}.vtt${search}`;
}
