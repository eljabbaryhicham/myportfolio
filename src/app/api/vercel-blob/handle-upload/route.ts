import { NextRequest, NextResponse } from 'next/server';
import { handleUpload } from '@vercel/blob/client';
import { verifyAdminRequest } from '@/lib/admin-auth';

// Health-check used by the client pre-flight so uploads fail loudly (with a
// clear message) instead of hanging at 0% when BLOB_READ_WRITE_TOKEN is unset.
export async function GET() {
  return NextResponse.json({ configured: !!process.env.BLOB_READ_WRITE_TOKEN });
}

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
      // Firestore mirroring is handled client-side (MediaLibrary) to avoid
      // duplicate docs and to work without Admin SDK Firestore permissions.
    });

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    console.error('handleUpload failed', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 400 });
  }
}
