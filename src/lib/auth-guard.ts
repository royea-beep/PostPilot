import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken, verifyAccessToken } from './auth';

type AuthHandler = (req: NextRequest, userId: string) => Promise<NextResponse>;

export function withAuth(handler: AuthHandler) {
  return async (req: NextRequest) => {
    const token = extractBearerToken(req.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
      const payload = verifyAccessToken(token);
      return handler(req, payload.userId);
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
  };
}
