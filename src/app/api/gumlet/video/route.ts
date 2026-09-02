import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { createGumletAssetFromUrl, createGumletUploadIntent, deleteGumletAsset, listGumletAssets } from '@/lib/gumlet-video';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  title: z.string().trim().max(256).optional(),
  format: z.enum(['ABR', 'MP4']),
  sourceUrl: z.string().url().max(2048).optional(),
});
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
  if (!parsed.success) return NextResponse.json({ success: false, message: 'A video title/format or a valid source URL is required.' }, { status: 400 });
  const { title, format, sourceUrl } = parsed.data;
  try {
    if (sourceUrl) {
      // Link-import: Gumlet downloads and transcodes the remote video.
      const styles = await createGumletAssetFromUrl(sourceUrl, title || '', format);
      return NextResponse.json({ success: true, asset: styles }, { status: 201 });
    }
    if (!title) return NextResponse.json({ success: false, message: 'A video title is required for direct upload.' }, { status: 400 });
    return NextResponse.json({ success: true, upload: await createGumletUploadIntent(title, format) }, { status: 201 });
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
