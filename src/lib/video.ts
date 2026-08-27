// Cloudinary video URL normalization for <video> playback.
//
// Some background/project URLs were stored with a duplicated transform
// (/f_auto,q_auto/f_auto,q_auto/...) or rely on f_auto content negotiation
// that misbehaves on mobile <video> elements. This produces a clean URL so
// playback is deterministic across Android/iOS/desktop. Progressive formats
// (.webm/.mov) are normalized to .mp4 (universally decodable), but HLS
// manifests (.m3u8) are left untouched — they must stream, not be rewritten.
export function cleanVideoUrl(input?: string | null): string | undefined {
  if (!input) return undefined;

  // Cloudinary deliver URLs: https://res.cloudinary.com/<cloud>/<res>/upload/...
  const m = input.match(/^(https?:\/\/[^/]+\/[^/]+)\/(image|video|raw)\/upload\/(.*)$/i);
  if (!m) return input;

  const [, base, resourceType, rest] = m;

  // Split into path segments; discard every leading transform segment until we
  // reach the /v<version>/ piece (this also drops any duplicated transforms).
  const segments = rest.split('/');
  let start = 0;
  while (start < segments.length - 1 && !/^v\d+$/.test(segments[start])) {
    start += 1;
  }

  const cleanPath = '/' + resourceType + '/upload/' + segments.slice(start).join('/');

  // Force a deterministic, universally decodable extension for the <video>, but
  // keep HLS (.m3u8) manifests as-is so they can be streamed.
  return (base + cleanPath).replace(/\.(webm|mov)$/i, '.mp4');
}
