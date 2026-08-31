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
  cleanRest = cleanRest.replace(/,fl_loop/gi, '').replace(/fl_loop,/gi, '').replace(/\/fl_loop\//gi, '/');

  const cleanPath = '/' + resourceType + '/upload/' + cleanRest;

  // Cap the resolution/bitrate of full-playback video URLs that carry no
  // explicit size limit. Admin-configured uploads (e.g. hero showreel, project
  // clips) are stored at full quality and can ship 10MB+ files to visitors.
  // Streaming HLS manifests are left untouched — they already adapt per
  // connection — and an existing w_/h_/br_ transform is respected.
  if (resourceType === 'video' && !cleanRest.includes('.m3u8')) {
    return addVideoCap(base + cleanPath);
  }

  // Force a deterministic, universally decodable extension for the <video>, but
  // keep HLS (.m3u8) manifests as-is so they can be streamed.
  return (base + cleanPath).replace(/\.(webm|mov)$/i, '.mp4');
}

// Injects a width + quality cap into `https://res.cloudinary.com/<c>/video/upload/...`
// URLs unless they already carry a resolution or bitrate constraint. Parsed
// segment-by-segment (far more robust than a single regex) because the flag
// chain and the version stamp are both slash-free adjacent segments:
//   /upload/v12345/file.mp4         (no transform)
//   /upload/f_auto,q_auto/v1/file   (transform chain)
function addVideoCap(url: string): string {
  const marker = '/video/upload/';
  const idx = url.indexOf(marker);
  if (idx === -1) return url;

  const prefix = url.slice(0, idx + marker.length);
  const after = url.slice(idx + marker.length);

  // Version-first (no transform chain): `v<digits>/...`.
  const flat = after.match(/^(v\d+\/)(.*)$/);
  let transforms = '';
  let rest: string;
  if (flat) {
    rest = flat[1] + flat[2];
  } else {
    // Transform chain first: everything up to the `/v<digits>/` marker.
    const transformed = after.match(/^(.*?)\/(v\d+\/.*)$/);
    if (!transformed) return url;
    transforms = transformed[1];
    rest = transformed[2];
  }

  const flags = transforms ? transforms.split(',') : [];
  const has = (re: RegExp) => flags.some((f) => re.test(f));
  if (has(/\bw_\d+\b/) || has(/\bh_\d+\b/) || has(/\bbr_/)) return url;

  // Avoid duplicating an existing q_auto by removing it before re-adding.
  const capped = [...flags.filter((f) => f !== 'q_auto'), 'w_1280', 'q_auto']
    .filter(Boolean)
    .join(',');
  return prefix + capped + '/' + rest;
}

export function lowQualityVideoUrl(input?: string | null): string | undefined {
  if (!input) return undefined;

  const m = input.match(/^(https?:\/\/[^/]+\/[^/]+)\/(image|video|raw)\/upload\/(.*)$/i);
  if (!m) return input;
  if (input.includes('.m3u8')) return input;
  if (input.includes('q_1')) return input;

  const [, base, resourceType] = m;
  const stripped = input.replace(/^(.*?\/upload\/)(?:[^/]+)?(\/v\d+\/)/, '$1$2');
  const id = stripped.slice(stripped.indexOf('/upload/') + '/upload/'.length);
  return `${base}/${resourceType}/upload/f_mp4,w_480,q_1/${id}`
    .replace(/\.(m3u8|webm|mp4|mov|jpeg|jpg|png|gif|webp|avif)$/i, '.mp4');
}

export function webmVideoUrl(input?: string | null): string | undefined {
  if (!input) return undefined;

  const m = input.match(/^(https?:\/\/[^/]+\/[^/]+)\/(image|video|raw)\/upload\/(.*)$/i);
  if (!m) return input;
  if (input.includes('.m3u8')) return input;

  const [, base, resourceType] = m;
  const stripped = input.replace(/^(.*?\/upload\/)(?:[^/]+)?(\/v\d+\/)/, '$1$2');
  const id = stripped.slice(stripped.indexOf('/upload/') + '/upload/'.length);
  return `${base}/${resourceType}/upload/f_webm,q_auto/${id}`
    .replace(/\.(m3u8|webm|mp4|mov|jpeg|jpg|png|gif|webp|avif)$/i, '.webm');
}
