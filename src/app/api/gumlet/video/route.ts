import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { createGumletUploadIntent, deleteGumletAsset, listGumletAssets } from '@/lib/gumlet-video';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({ title: z.string().trim().min(1).max(256), format: z.enum(['ABR', 'MP4']) });
const deleteSchema = z.object({ assetId: z.string().trim().min(1).max(128) });

function gumletError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Gumlet request failed.';
  return NextResponse.json({ success: false, message }, { status: message.startsWith('Gumlet Video is not configured.') ? 503 : 502 });
}

export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req, 'canUploadMedia'))) {
    return NextResponse.json({ success: false, message: 'Unauthorized. Admin authentication required.' }, { status: 401 });
  }
  try {
    const assets = await listGumletAssets(req.nextUrl.searchParams.get('search') ?? undefined);
    return NextResponse.json({ success: true, assets });
  } catch (error) {
    return gumletError(error);
  }
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req, 'canUploadMedia'))) {
    return NextResponse.json({ success: false, message: 'Unauthorized. Admin authentication required.' }, { status: 401 });
  }
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, message: 'A video title and ABR or MP4 format are required.' }, { status: 400 });
  try {
    return NextResponse.json({ success: true, upload: await createGumletUploadIntent(parsed.data.title, parsed.data.format) }, { status: 201 });
  } catch (error) {
    return gumletError(error);
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await verifyAdminRequest(req, 'canDeleteMedia'))) {
    return NextResponse.json({ success: false, message: 'Unauthorized. Delete permission required.' }, { status: 401 });
  }
  const parsed = deleteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, message: 'A valid Gumlet asset id is required.' }, { status: 400 });
  try {
    await deleteGumletAsset(parsed.data.assetId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return gumletError(error);
  }
}
