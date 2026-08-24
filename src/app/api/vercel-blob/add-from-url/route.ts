import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { initializeServerApp } from '@/firebase/server-init';
import admin from 'firebase-admin';

export async function POST(req: NextRequest) {
  const decoded = await verifyAdminRequest(req);
  if (!decoded) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ success: false, message: 'Vercel Blob not configured' }, { status: 503 });
  }

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
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const buffer = await res.arrayBuffer();
    const size = buffer.byteLength;

    if (contentType.startsWith('image/') && size > 50 * 1024 * 1024) {
      return NextResponse.json({ success: false, message: 'Image exceeds 50MB limit' }, { status: 413 });
    }

    const urlParts = new URL(url);
    const originalName = urlParts.pathname.split('/').pop() || 'file';
    const sanitized = originalName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'file';
    const pathname = `vercel-blob/${Date.now()}-${sanitized}`;

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
