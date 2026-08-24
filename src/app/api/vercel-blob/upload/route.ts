import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { initializeServerApp } from '@/firebase/server-init';
import admin from 'firebase-admin';
import { verifyAdminRequest } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  const decoded = await verifyAdminRequest(req);
  if (!decoded) {
    return NextResponse.json({ success: false, message: 'Unauthorized. Admin authentication required.' }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ success: false, message: 'Vercel Blob not configured. Set BLOB_READ_WRITE_TOKEN.' }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ success: false, message: 'Missing file' }, { status: 400 });
  }

  const IMAGE_MAX = 50 * 1024 * 1024;
  if (file.type.startsWith('image/') && file.size > IMAGE_MAX) {
    return NextResponse.json({ success: false, message: 'Image exceeds 50MB limit' }, { status: 413 });
  }

  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const pathname = `vercel-blob/${Date.now()}-${sanitized}`;

  try {
    const blob = await put(pathname, file, { access: 'public' });

    try {
      const app = await initializeServerApp();
      const db = admin.firestore(app);
      await db.collection('vercel_blobs').add({
        provider: 'vercel_blob',
        url: blob.url,
        pathname: blob.pathname,
        size: file.size,
        contentType: file.type || 'application/octet-stream',
        filename: file.name,
        uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
        uploadedBy: decoded.uid,
      });
    } catch (fireErr) {
      console.warn('Vercel Blob uploaded but Firestore mirror failed', fireErr);
    }

    return NextResponse.json({
      success: true,
      url: blob.url,
      pathname: blob.pathname,
      size: file.size,
      contentType: file.type,
    });
  } catch (e: any) {
    console.error('Vercel Blob put failed', e);
    return NextResponse.json({ success: false, message: e?.message || 'Upload failed' }, { status: 500 });
  }
}
