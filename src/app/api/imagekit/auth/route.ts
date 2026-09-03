import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { createImageKitUploadAuth } from '@/lib/imagekit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req, 'canUploadMedia'))) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized. Admin authentication required.' },
      { status: 401 }
    );
  }

  try {
    return NextResponse.json({ success: true, ...createImageKitUploadAuth() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ImageKit authentication could not be generated.';
    return NextResponse.json({ success: false, message }, { status: 503 });
  }
}
