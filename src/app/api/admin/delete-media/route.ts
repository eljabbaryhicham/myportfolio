import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { deleteCloudinaryAsset } from '@/lib/cloudinary-delete';
import { isRateLimited, clientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const bodySchema = z.object({
  publicId: z.string().min(1, 'Missing publicId.'),
  resourceType: z.enum(['image', 'video', 'raw']).optional(),
  // Lenient on purpose: legacy media docs may carry an unexpected libraryId.
  // `deleteCloudinaryAsset` normalizes anything other than 'extented' to 'primary'.
  libraryId: z.string().optional(),
});

// Diagnostic probe: opening this URL in a browser distinguishes a route that
// fails to LOAD (GET also returns the empty 500) from a POST handler that
// crashes. A route chunk that fails at import time crashes before any handler
// code can run, so no log/handler would ever be reachable.
export async function GET() {
  return NextResponse.json({ ok: true, route: '/api/admin/delete-media' });
}

export async function POST(req: NextRequest) {
  if (isRateLimited(clientIp(req), 30)) {
    return NextResponse.json({ success: false, message: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    return await handlePost(req);
  } catch (error) {
    logger.error('[delete-media] unhandled error:', error);
    const message =
      error instanceof Error ? error.message : 'Unexpected server error.';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

async function handlePost(req: NextRequest) {
  const decoded = await verifyAdminRequest(req, 'canDeleteMedia');
  if (!decoded) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized. Admin authentication required.' },
      { status: 401 }
    );
  }

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

  return NextResponse.json(
    { success: result.success, message: result.message },
    { status: result.status }
  );
}