import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { deleteCloudinaryAsset } from '@/lib/cloudinary-delete';

const bodySchema = z.object({
  publicId: z.string().min(1, 'Missing publicId.'),
  resourceType: z.string().optional(),
  libraryId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  console.log('[delete-media] request received');
  // Admin gate: superadmin email OR an existing user doc with
  // `permissions.canDeleteMedia === true`. Fails closed.
  const decoded = await verifyAdminRequest(req, 'canDeleteMedia');
  if (!decoded) {
    console.warn('[delete-media] auth failed');
    return NextResponse.json(
      { success: false, message: 'Unauthorized. Admin authentication required.' },
      { status: 401 }
    );
  }
  console.log('[delete-media] auth ok for', decoded.uid);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid input.' },
      { status: 400 }
    );
  }

  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : '';

  const result = await deleteCloudinaryAsset({
    publicId: parsed.data.publicId,
    resourceType: parsed.data.resourceType,
    libraryId: parsed.data.libraryId,
    idToken,
  });
  console.log('[delete-media] result', { success: result.success, status: result.status });

  return NextResponse.json(
    { success: result.success, message: result.message },
    { status: result.status }
  );
}