import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
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
  const decoded = await verifyAdmin(req);
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
  const url: string | undefined = body?.url;
  if (!url) {
    return NextResponse.json({ success: false, message: 'Missing url' }, { status: 400 });
  }

  try {
    await del(url);

    // Also delete Firestore mirror docs with matching url
    try {
      const app = await initializeServerApp();
      const db = admin.firestore(app);
      const snap = await db.collection('vercel_blobs').where('url', '==', url).get();
      const batch = db.batch();
      snap.forEach((d) => batch.delete(d.ref));
      if (!snap.empty) await batch.commit();
    } catch (fireErr) {
      console.warn('Blob deleted but Firestore cleanup failed', fireErr);
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Vercel Blob del failed', e);
    return NextResponse.json({ success: false, message: e?.message || 'Delete failed' }, { status: 500 });
  }
}
