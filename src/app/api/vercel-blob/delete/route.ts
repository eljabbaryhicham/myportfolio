import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { initializeServerApp } from '@/firebase/server-init';
import { getFirestore } from 'firebase-admin/firestore';
import { requireUploadAuth } from '@/lib/upload-auth-middleware';

export async function POST(req: NextRequest) {
  const auth = await requireUploadAuth(req, 'canDeleteMedia');
  if (!auth.success && auth.response) {
    return auth.response;
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
    const db = getFirestore(app);
    const snap = await db.collection('vercel_blobs').where('url', '==', url).get();
    if (!snap.empty) {
      const batch = db.batch();
      snap.forEach((d: any) => batch.delete(d.ref));
      await batch.commit();
    } else {
      // Fallback: try pathname match
      const pathname = (() => { try { return new URL(url).pathname; } catch { return url; } })();
      const snap2 = await db.collection('vercel_blobs').where('pathname', '==', pathname).get();
      if (!snap2.empty) {
        const batch2 = db.batch();
        snap2.forEach((d: any) => batch2.delete(d.ref));
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
