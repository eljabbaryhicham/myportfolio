import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { initializeServerApp } from '@/firebase/server-init';
import { deleteImageKitFile, IMAGEKIT_MEDIA_COLLECTION } from '@/lib/imagekit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const deleteSchema = z.object({ fileId: z.string().trim().min(1).max(256) });
const createSchema = z.object({
  fileId: z.string().trim().min(1).max(256),
  url: z.string().url().max(4096),
  name: z.string().trim().min(1).max(512),
  fileType: z.enum(['image', 'video', 'non-image']),
  resourceType: z.enum(['image', 'video', 'raw']),
  filePath: z.string().max(1024).optional(),
  thumbnailUrl: z.string().url().max(4096).optional(),
  size: z.number().int().nonnegative().optional(),
});

export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req, 'canUploadMedia'))) {
    return NextResponse.json({ success: false, message: 'Unauthorized. Admin authentication required.' }, { status: 401 });
  }
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, message: 'Invalid ImageKit asset metadata.' }, { status: 400 });
  try {
    const db = getFirestore(await initializeServerApp());
    const doc = await db.collection(IMAGEKIT_MEDIA_COLLECTION).add({ provider: 'imagekit', ...parsed.data, createdAt: new Date().toISOString() });
    return NextResponse.json({ success: true, id: doc.id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not register the ImageKit upload.';
    return NextResponse.json({ success: false, message }, { status: 502 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await verifyAdminRequest(req, 'canDeleteMedia'))) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized. Delete permission required.' },
      { status: 401 }
    );
  }

  const parsed = deleteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'A valid ImageKit file id is required.' }, { status: 400 });
  }

  try {
    await deleteImageKitFile(parsed.data.fileId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ImageKit file deletion failed.';
    const status = message.startsWith('ImageKit is not configured.') ? 503 : 502;
    return NextResponse.json({ success: false, message }, { status });
  }
}
