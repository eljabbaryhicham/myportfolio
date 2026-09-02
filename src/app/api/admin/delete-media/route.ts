import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { deleteCloudinaryAsset } from '@/lib/cloudinary-delete';

const bodySchema = z.object({
  publicId: z.string().min(1, 'Missing publicId.'),
  resourceType: z.string().optional(),
  libraryId: z.string().optional(),
});

// Diagnostic probe: opening this URL in a browser distinguishes a route that
// fails to LOAD (GET also returns the empty 500) from a POST handler that
// crashes. A route chunk that fails at import time crashes before any handler
// code can run, so no log/handler would ever be reachable.
export async function GET() {
  console.log('[delete-media] GET probe hit');
  return NextResponse.json({ ok: true, route: '/api/admin/delete-media' });
}

export async function POST(req: NextRequest) {
  console.log('[delete-media] request received');
  try {
    return await handlePost(req);
  } catch (error) {
    // An unhandled error here would otherwise surface to the client as a
    // 500 with an EMPTY body (Next hides route-handler errors in production),
    // producing a useless toast. Return the real message as JSON instead.
    console.error('[delete-media] unhandled error:', error);
    const message =
      error instanceof Error ? error.message : 'Unexpected server error.';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

async function handlePost(req: NextRequest) {
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