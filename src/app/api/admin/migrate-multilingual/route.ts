import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { runMigrationIfNeeded } from '@/ai/flows/migrate-multilingual';

export async function POST(req: NextRequest) {
  const decoded = await verifyAdminRequest(req);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runMigrationIfNeeded();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Migration API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'POST to run multilingual migration. This converts single-language text fields to {en, fr} objects.' 
  });
}