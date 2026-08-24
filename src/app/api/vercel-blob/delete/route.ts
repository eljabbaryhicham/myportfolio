import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { initializeServerApp } from '@/firebase/server-init';
import admin from 'firebase-admin';
import { verifyAdminRequest } from '@/lib/admin-auth';

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
  const url: string | undefined = body?.url;
  if (!url) {
    return NextResponse.json({ success: false, message: 'Missing url' }, { status: 400 });
  }

  try {
    await del(url);

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
