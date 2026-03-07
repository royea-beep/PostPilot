import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { buildAuthUrl, type PlatformKey } from '@/lib/platforms';

const VALID_PLATFORMS = new Set<string>(['instagram', 'facebook', 'tiktok']);

/**
 * GET /api/platforms/:platform/connect?brandId=xxx
 *
 * Initiates OAuth flow by redirecting the user to the platform's authorization URL.
 * The `state` parameter is a signed JWT-like token that encodes the userId, brandId,
 * and a CSRF nonce so the callback can verify the request.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;

  if (!VALID_PLATFORMS.has(platform)) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
  }

  // Authenticate the user
  const token = extractBearerToken(req.headers.get('authorization'));
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let userId: string;
  try {
    const payload = verifyAccessToken(token);
    userId = payload.userId;
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  const brandId = req.nextUrl.searchParams.get('brandId');
  if (!brandId) {
    return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
  }

  // Verify ownership
  const brand = await prisma.brand.findFirst({
    where: { id: brandId, userId },
  });
  if (!brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
  }

  // Build state: base64-encoded JSON with a nonce for CSRF protection
  const nonce = crypto.randomBytes(16).toString('hex');
  const statePayload = JSON.stringify({ userId, brandId, platform, nonce });
  const state = Buffer.from(statePayload).toString('base64url');

  // Upsert a PENDING connection so we can track the flow
  await prisma.socialConnection.upsert({
    where: { brandId_platform: { brandId, platform } },
    create: {
      brandId,
      platform,
      status: 'PENDING',
    },
    update: {
      status: 'PENDING',
      encryptedAccessToken: null,
      encryptedRefreshToken: null,
      iv: null,
      authTag: null,
      tokenExpiresAt: null,
    },
  });

  const authUrl = buildAuthUrl(platform as PlatformKey, state);

  return NextResponse.json({ url: authUrl });
}
