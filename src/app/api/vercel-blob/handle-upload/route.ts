import { NextRequest, NextResponse } from 'next/server';
import { handleUpload } from '@vercel/blob/client';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { initializeServerApp } from '@/firebase/server-init';
import admin from 'firebase-admin';

export async function POST(req: NextRequest) {
  const decoded = await verifyAdminRequest(req);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'Vercel Blob not configured. Set BLOB_READ_WRITE_TOKEN.' }, { status: 503 });
  }

  const body = await req.json();

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        // Allow all types — do not restrict allowedContentTypes (empty array = block all)
        const lower = pathname.toLowerCase();
        const isImage = /\.(png|jpe?g|gif|webp|avif|svg|bmp|tiff)$/.test(lower);
        return {
          // allowedContentTypes omitted = allow all (fixes mp4 not allowed)
          maximumSizeInBytes: isImage ? 50 * 1024 * 1024 : undefined,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ uid: decoded.uid, filename: pathname.split('/').pop() || 'file' }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          const app = await initializeServerApp();
          const db = admin.firestore(app);
          let payload: any = {};
          try { payload = JSON.parse(tokenPayload || '{}'); } catch {}
          await db.collection('vercel_blobs').add({
            provider: 'vercel_blob',
            url: blob.url,
            pathname: blob.pathname,
            size: (blob as any).size ?? null,
            contentType: blob.contentType || 'application/octet-stream',
            filename: payload.filename || blob.pathname.split('/').pop() || 'file',
            uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
            uploadedBy: payload.uid || decoded.uid,
          });
        } catch (e) {
          console.error('Vercel Blob onUploadCompleted Firestore mirror failed', e);
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    console.error('handleUpload failed', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 400 });
  }
}
