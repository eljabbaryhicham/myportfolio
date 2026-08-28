// Shared SSRF guard. Used by any server route that fetches a user-supplied
// URL (e.g. /api/vercel-blob/add-from-url, the Genkit upload-from-URL flow).
// Returns true for hosts that point back at the local machine, the private
// network, or known cloud-metadata endpoints.

export function isInternalUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    if (host === 'localhost' || host === '0.0.0.0' || host.endsWith('.local')) return true;
    if (/^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return true;
    if (host === 'metadata' || host === 'metadata.google.internal' || host.endsWith('.internal')) return true;
    // IPv6 loopback / unique-local
    if (host.startsWith('[') && /(::1|::ffff:127\.|fc00:|fd00:|fe80:)/.test(host)) return true;
    const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4) {
      const n = ipv4.slice(1).map(Number);
      if (n.every((x) => x <= 255)) {
        if (n[0] === 10 || (n[0] === 172 && n[1] >= 16 && n[1] <= 31) ||
            (n[0] === 192 && n[1] === 168) || n[0] === 127 || n[0] === 0 ||
            (n[0] === 169 && n[1] === 254)) return true;
      }
    }
    return false;
  } catch {
    return true;
  }
}
