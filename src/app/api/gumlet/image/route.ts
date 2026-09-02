import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeServerApp } from '@/firebase/server-init';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { gumletImageDeliveryUrl, gumletImageFilename } from '@/lib/gumlet-image';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const schema = z.object({ sourceUrl: z.string().url().max(2048) });

function fail(error: unknown) {
  const message = error instanceof Error ? error.message : 'Gumlet Image request failed.';
  return NextResponse.json({ success: false, message }, { status: message.startsWith('Gumlet Image is not configured.') ? 503 : 400 });
}

export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req, 'canUploadMedia'))) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  try {
    const db = getFirestore(await initializeServerApp());
    const snapshot = await db.collection('gumlet_images').orderBy('createdAt', 'desc').limit(100).get();
    return NextResponse.json({ success: true, images: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) });
  } catch (error) { return fail(error); }
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req, 'canUploadMedia'))) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, message: 'A valid HTTPS image URL is required.' }, { status: 400 });
  try {
    const sourceUrl = parsed.data.sourceUrl;
    const image = { sourceUrl, deliveryUrl: gumletImageDeliveryUrl(sourceUrl), filename: gumletImageFilename(sourceUrl), createdAt: new Date().toISOString() };
    const db = getFirestore(await initializeServerApp());
    const ref = await db.collection('gumlet_images').add(image);
    return NextResponse.json({ success: true, image: { id: ref.id, ...image } }, { status: 201 });
  } catch (error) { return fail(error); }
}

export async function DELETE(req: NextRequest) {
  if (!(await verifyAdminRequest(req, 'canDeleteMedia'))) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  const parsed = z.object({ id: z.string().min(1) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, message: 'Image id is required.' }, { status: 400 });
  try {
    const db = getFirestore(await initializeServerApp());
    await db.collection('gumlet_images').doc(parsed.data.id).delete();
    return NextResponse.json({ success: true });
  } catch (error) { return fail(error); }
}
