import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { requireUploadAuth } from '@/lib/upload-auth-middleware';

export async function GET() {
  return NextResponse.json({ configured: !!process.env.BLOB_READ_WRITE_TOKEN });
}

export async function POST(req: NextRequest) {
  const auth = await requireUploadAuth(req, 'canUploadMedia');
  if (!auth.success && auth.response) {
    return auth.response;
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

    // Firestore mirror is handled client-side (VercelBlobAdmin) to avoid
    // duplicate docs and to work without Admin SDK Firestore permissions.
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
