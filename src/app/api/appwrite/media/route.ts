import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdminRequest } from '@/lib/admin-auth';
import {
  deleteAppwriteFile,
  linkAppwriteFile,
  listAppwriteFiles,
  MAX_UPLOAD_BYTES,
  uploadAppwriteFile,
} from '@/lib/appwrite-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const deleteSchema = z.object({ fileId: z.string().min(1).max(36) });
const linkSchema = z.object({ sourceUrl: z.string().url().max(2048), filename: z.string().trim().max(240).optional() });

function appwriteError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Appwrite request failed.';
  const unavailable = message.startsWith('Appwrite media is not configured.');
  return NextResponse.json({ success: false, message }, { status: unavailable ? 503 : 502 });
}

export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req, 'canUploadMedia'))) {
    return NextResponse.json({ success: false, message: 'Unauthorized. Admin authentication required.' }, { status: 401 });
  }

  const search = req.nextUrl.searchParams.get('search')?.slice(0, 256);
  try {
    const files = await listAppwriteFiles(search);
    return NextResponse.json({ success: true, files });
  } catch (error) {
    return appwriteError(error);
  }
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req, 'canUploadMedia'))) {
    return NextResponse.json({ success: false, message: 'Unauthorized. Admin authentication required.' }, { status: 401 });
  }

  const contentType = req.headers.get('content-type') || '';

  // JSON link-import: fetch remote bytes and store them in Appwrite.
  if (contentType.includes('application/json')) {
    const parsed = linkSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'A valid HTTPS file URL is required.' }, { status: 400 });
    }
    try {
      const asset = await linkAppwriteFile(parsed.data.sourceUrl, parsed.data.filename);
      return NextResponse.json({ success: true, file: asset }, { status: 201 });
    } catch (error) {
      return appwriteError(error);
    }
  }

  // Multipart file upload.
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: 'Missing file.' }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ success: false, message: 'Empty files cannot be uploaded.' }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { success: false, message: `File exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB Appwrite upload limit.` },
        { status: 413 }
      );
    }

    const asset = await uploadAppwriteFile(file);
    return NextResponse.json({ success: true, file: asset }, { status: 201 });
  } catch (error) {
    return appwriteError(error);
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await verifyAdminRequest(req, 'canDeleteMedia'))) {
    return NextResponse.json({ success: false, message: 'Unauthorized. Delete permission required.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON body.' }, { status: 400 });
  }
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'A valid Appwrite file id is required.' }, { status: 400 });
  }

  try {
    await deleteAppwriteFile(parsed.data.fileId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return appwriteError(error);
  }
}
