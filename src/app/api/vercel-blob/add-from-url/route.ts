import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { requireUploadAuth } from '@/lib/upload-auth-middleware';
import { initializeServerApp } from '@/firebase/server-init';
import admin from 'firebase-admin';

export async function POST(req: NextRequest) {
  const auth = await requireUploadAuth(req, 'canUploadMedia');
  if (!auth.success && auth.response) {
    return auth.response;
  }
  const decoded = auth.user!;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
  }
  const url = body?.url?.trim();
  if (!url || !/^https?:\/\//.test(url)) {
    return NextResponse.json({ success: false, message: 'Invalid URL' }, { status: 400 });
  }

  try {
    // Fetch with browser-like headers to handle sites that block generic fetch
    const fetchWithHeaders = (u: string, extraHeaders: Record<string, string> = {}) =>
      fetch(u, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          ...extraHeaders,
        },
        redirect: 'follow',
      });

    let res = await fetchWithHeaders(url);
    let buffer = await res.arrayBuffer();
    let contentType = res.headers.get('content-type') || 'application/octet-stream';
    let size = buffer.byteLength;

    // Handle JS cookie challenges (e.g., board.jdownloader.org sets firstvisit via JS and reloads)
    // The initial 203-byte HTML with text/html is the challenge page, not the image
    const text = size < 2048 ? new TextDecoder().decode(buffer.slice(0, Math.min(buffer.byteLength, 2048))) : '';
    if (contentType.includes('text/html') && text.includes('firstvisit')) {
      // Retry with the cookie that the JS would have set
      res = await fetchWithHeaders(url, { Cookie: 'firstvisit=Max' });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
      contentType = res.headers.get('content-type') || contentType;
      buffer = await res.arrayBuffer();
      size = buffer.byteLength;
    }

    // Fallback contentType from file extension when server returns generic HTML (e.g., challenge page bypass failed or misconfigured server)
    const urlLower = url.toLowerCase();
    const ext = urlLower.split('.').pop()?.split('?')[0] || '';
    if (contentType.includes('text/html') && ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg', 'bmp'].includes(ext)) {
      const mimeMap: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif', svg: 'image/svg+xml', bmp: 'image/bmp' };
      contentType = mimeMap[ext] || contentType;
    }

    if (contentType.startsWith('image/') && size > 50 * 1024 * 1024) {
      return NextResponse.json({ success: false, message: 'Image exceeds 50MB limit' }, { status: 413 });
    }

    const urlParts = new URL(url);
    const originalName = urlParts.pathname.split('/').pop() || 'file';
    const sanitized = originalName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'file';
    const pathname = `${Date.now()}-${sanitized}`;

    const blob = await put(pathname, buffer, { access: 'public', contentType } as any);

    try {
      const app = await initializeServerApp();
      const db = admin.firestore(app);
      await db.collection('vercel_blobs').add({
        provider: 'vercel_blob',
        url: blob.url,
        pathname: blob.pathname,
        size,
        contentType,
        filename: originalName,
        uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
        uploadedBy: decoded.uid,
        sourceUrl: url,
      });
    } catch (e) {
      console.warn('Firestore mirror failed for add-from-url', e);
    }

    return NextResponse.json({ success: true, url: blob.url, pathname: blob.pathname, contentType, size, filename: originalName });
  } catch (e: any) {
    console.error('Vercel Blob add-from-url failed', e);
    return NextResponse.json({ success: false, message: e?.message || 'Failed to fetch URL' }, { status: 500 });
  }
}
