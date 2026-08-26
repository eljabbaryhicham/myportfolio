import { NextResponse, type NextRequest } from 'next/server';

// Generate a cryptographically-random base64 string.
function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, (c) => {
    switch (c) {
      case '+': return '-';
      case '/': return '_';
      default: return '';
    }
  });
}

// Content-Security-Policy — mirrored into a `nonce` so the inline scripts
// (theme/lang, app-height, mobile detection) and Next's inline bootstrap are
// allowed without 'unsafe-inline'. The domains below match what the app loads.
const CSP = (nonce: string): string =>
  `default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; ` +
  `script-src 'self' 'nonce-${nonce}' https://va.vercel-scripts.com https://cdn.jsdelivr.net; ` +
  `style-src 'self' 'unsafe-inline'; font-src 'self' data:; ` +
  `img-src 'self' data: https:; ` +
  `connect-src 'self' https://firestore.googleapis.com https://studio-8316917408-a299a.firebaseapp.com https://identitytoolkit.googleapis.com https://api.cloudinary.com https://*.public.blob.vercel-storage.com https://va.vercel-scripts.com https://static.cloudflareinsights.com; ` +
  `worker-src 'self' blob:`;

export function proxy(request: NextRequest) {
  const nonce = generateNonce();
  const response = NextResponse.next();

  // Expose the nonce to the layout so the manual inline <script> tags can
  // declare nonce={nonce}. Next.js auto-applies the nonce it reads from the
  // CSP header to its own inline scripts.
  response.headers.set('x-nonce', nonce);

  // Security headers
  response.headers.set('Content-Security-Policy', CSP(nonce));
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

  return response;
}

export const config = {
  // Run on all routes (proxy needs to run for the nonce on every page).
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)'],
};
