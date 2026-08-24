import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import { initializeServerApp } from '@/firebase/server-init';
import admin from 'firebase-admin';

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;
  try {
    const app = await initializeServerApp();
    const decoded = await admin.auth(app).verifyIdToken(token);
    return decoded;
  } catch (e) {
    console.error('Vercel Blob auth verification failed', e);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const decoded = await verifyAdmin(req);
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
