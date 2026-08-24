import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { initializeServerApp } from '@/firebase/server-init';
import admin from 'firebase-admin';

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;
  try {
    const app = await initializeServerApp();
    const decoded = await admin.auth(app).verifyIdToken(token);
    return decoded;
  } catch (e) {
    console.error('Vercel Blob auth verification failed', e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  // 1. Auth check
  const decoded = await verifyAdmin(req);
  if (!decoded) {
    return NextResponse.json({ success: false, message: 'Unauthorized. Admin authentication required.' }, { status: 401 });
  }

  // 2. Token check
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

  // 3. Size limits: Images max 50MB, others unlimited
  const IMAGE_MAX = 50 * 1024 * 1024;
  if (file.type.startsWith('image/') && file.size > IMAGE_MAX) {
    return NextResponse.json({ success: false, message: 'Image exceeds 50MB limit' }, { status: 413 });
  }

  // Allowed all types — no MIME filter

  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const pathname = `vercel-blob/${Date.now()}-${sanitized}`;

  try {
    const blob = await put(pathname, file, { access: 'public' });

    // Mirror metadata to Firestore with provider field
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
      // Still succeed — blob is stored
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
