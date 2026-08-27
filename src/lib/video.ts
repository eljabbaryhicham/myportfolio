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

    // Fix duplicated transforms like /f_auto,q_auto/f_auto,q_auto/ which break
  // Cloudinary delivery and <video> decoding on mobile. Only deduplicate
  // *repeated* leading transform segments — preserve legitimate optimizations
  // like q_auto, w_720, etc. so we keep Cloudinary's optimized delivery
  // and don't force the original huge file (which makes loading slow).
  let cleanRest = rest;
  // Collapse "/<transform>/<same transform>/" into "/<transform>/"
  cleanRest = cleanRest.replace(/^([^/]+)\/\1\//, '$1/');
  // Also handle the specific known duplication: f_auto,q_auto repeated
  cleanRest = cleanRest.replace(/^(f_auto[^/]*\/)\1/, '$1');

  const cleanPath = '/' + resourceType + '/upload/' + cleanRest;

  // Force a deterministic, universally decodable extension for the <video>, but
  // keep HLS (.m3u8) manifests as-is so they can be streamed.
  return (base + cleanPath).replace(/\.(webm|mov)$/i, '.mp4');
}
