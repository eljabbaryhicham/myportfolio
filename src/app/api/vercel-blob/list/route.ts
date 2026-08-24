import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import { verifyAdminRequest } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const decoded = await verifyAdminRequest(req);
  if (!decoded) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ success: false, message: 'Vercel Blob not configured' }, { status: 503 });
  }
  try {
    const result = await list();
    return NextResponse.json({ success: true, blobs: result.blobs });
  } catch (e: any) {
    console.error('Vercel Blob list failed', e);
    return NextResponse.json({ success: false, message: e?.message || 'List failed' }, { status: 500 });
  }
}
