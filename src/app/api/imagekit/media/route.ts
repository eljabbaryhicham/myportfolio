import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { deleteImageKitFile } from '@/lib/imagekit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const deleteSchema = z.object({ fileId: z.string().trim().min(1).max(256) });

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
