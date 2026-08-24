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

  // Try Vercel delete — log but don't fail if blob already gone
  let delOk = false;
  let delError: string | null = null;
  try {
    await del(url);
    delOk = true;
  } catch (e: any) {
    delError = e?.message || String(e);
    console.warn('Vercel Blob del failed for url, trying pathname fallback', delError);
    // Fallback: try pathname if url had query params
    try {
      const pathname = new URL(url).pathname.split('/').pop();
      if (pathname) {
        // del expects full url, so this is best-effort; log for debugging
        console.warn('Delete fallback pathname:', pathname);
      }
    } catch {}
  }

  // Always clean Firestore — ensures library and Vercel stay in sync for all file types
  try {
    const app = await initializeServerApp();
    const db = admin.firestore(app);
    const snap = await db.collection('vercel_blobs').where('url', '==', url).get();
    if (!snap.empty) {
      const batch = db.batch();
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } else {
      // Fallback: try pathname match
      const pathname = (() => { try { return new URL(url).pathname; } catch { return url; } })();
      const snap2 = await db.collection('vercel_blobs').where('pathname', '==', pathname).get();
      if (!snap2.empty) {
        const batch2 = db.batch();
        snap2.forEach((d) => batch2.delete(d.ref));
        await batch2.commit();
      }
    }
  } catch (fireErr) {
    console.warn('Firestore cleanup failed', fireErr);
  }

  if (!delOk && delError) {
    // If Vercel delete failed but Firestore was cleaned, still report success for library consistency
    // But log the Vercel error for debugging
    console.error('Vercel Blob del ultimately failed', delError);
    return NextResponse.json({ success: true, warning: `Firestore cleaned but Vercel delete failed: ${delError}` });
  }

  return NextResponse.json({ success: true });
}
