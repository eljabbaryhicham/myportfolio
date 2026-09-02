import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from './admin-auth';

export type UploadPermission = 'canUploadMedia' | 'canDeleteMedia';

export interface AuthResult {
  success: boolean;
  response?: NextResponse;
  user?: { uid: string; email?: string };
}

export async function requireUploadAuth(
  req: NextRequest,
  permission: UploadPermission
): Promise<AuthResult> {
  const decoded = await verifyAdminRequest(req, permission);
  if (!decoded) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, message: 'Unauthorized. Admin authentication required.' },
        { status: 401 }
      ),
    };
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, message: 'Vercel Blob not configured. Set BLOB_READ_WRITE_TOKEN.' },
        { status: 503 }
      ),
    };
  }

  return {
    success: true,
    user: { uid: decoded.uid, email: decoded.email },
  };
}

export async function requireUploadMiddleware(
  req: NextRequest,
  permission: UploadPermission
): Promise<NextResponse | null> {
  const result = await requireUploadAuth(req, permission);
  if (!result.success && result.response) {
    return result.response;
  }
  return null;
}