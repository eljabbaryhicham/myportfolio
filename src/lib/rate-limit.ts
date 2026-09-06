import { type NextRequest } from 'next/server';

/**
 * In-memory per-IP rate limiter.
 * NOTE: In serverless environments (Vercel), each invocation gets a fresh
 * process — the Map is not shared between instances. This is a best-effort
 * defense; for production-grade limiting, use an external store (Upstash Redis).
 */

const hits = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(ip: string, maxRequests: number, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > maxRequests;
}

export function clientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}
