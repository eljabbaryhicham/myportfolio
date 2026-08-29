import { NextResponse, type NextRequest } from 'next/server';

// Static Content-Security-Policy. We use unsafe-inline for script-src because
// Next.js injects inline bootstrap scripts and the layout has manual inline
// <script> tags (theme/lang, app-height, mobile detection). This keeps routes
// statically prerendered (fast navigation) instead of forcing per-request
// nonces which made the app dynamic. All other directives stay strict.
// We also keep unsafe-eval in script-src because Clappr (@clappr/player) bundles
// Underscore's tmpl(), which compiles its UI templates (mediacontrol, poster,
// spinner, etc.) via new Function(). Without it the player throws and shows a
// black screen.
// NOTE media-src/frame-src are NOT covered by default-src (which is 'self').
// Video/audio playback would be silently blocked on external hosts (Cloudinary,
// Vercel Blob, YouTube, Vimeo) — the poster/thumbnail still renders via
// img-src https:, which is exactly the "shows thumbnail but video never plays"
// symptom. Media and embeds must be explicitly allowlisted.
const CSP =
  `default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; ` +
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://cdn.jsdelivr.net https://static.cloudflareinsights.com; ` +
  `style-src 'self' 'unsafe-inline'; font-src 'self' data:; ` +
  `img-src 'self' data: https:; ` +
  `media-src 'self' https://res.cloudinary.com https://*.public.blob.vercel-storage.com https://*.vercel-storage.com https://portfolio-hicham-ten.vercel.app blob:; ` +
  `frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com; ` +
  `connect-src 'self' https://firestore.googleapis.com https://studio-8316917408-a299a.firebaseapp.com https://identitytoolkit.googleapis.com https://res.cloudinary.com https://api.cloudinary.com https://*.public.blob.vercel-storage.com https://*.vercel-storage.com https://portfolio-hicham-ten.vercel.app https://cdn.plyr.io https://va.vercel-scripts.com https://static.cloudflareinsights.com; ` +
  `worker-src 'self' blob:`;

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers (static — compatible with statically prerendered routes).
  response.headers.set('Content-Security-Policy', CSP);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)'],
};
