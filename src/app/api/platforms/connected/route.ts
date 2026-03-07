import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';

/**
 * GET /api/platforms/connected?brandId=xxx
 *
 * Returns all social connections for a brand, with status info.
 * Tokens are NOT returned — only connection metadata.
 */
export const GET = withAuth(async (req: NextRequest, userId: string) => {
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

  const connections = await prisma.socialConnection.findMany({
    where: { brandId },
    select: {
      id: true,
      platform: true,
      platformUserId: true,
      accountName: true,
      accountAvatar: true,
      status: true,
      scopes: true,
      tokenExpiresAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Enrich with expiry status
  const enriched = connections.map((c) => ({
    ...c,
    isExpired: c.tokenExpiresAt ? new Date(c.tokenExpiresAt) < new Date() : false,
    expiresIn: c.tokenExpiresAt
      ? Math.max(0, Math.floor((new Date(c.tokenExpiresAt).getTime() - Date.now()) / 1000))
      : null,
  }));

  return NextResponse.json(enriched);
});

/**
 * DELETE /api/platforms/connected?brandId=xxx&platform=yyy
 *
 * Disconnects a platform by revoking the connection record.
 */
export const DELETE = withAuth(async (req: NextRequest, userId: string) => {
  const brandId = req.nextUrl.searchParams.get('brandId');
  const platform = req.nextUrl.searchParams.get('platform');

  if (!brandId || !platform) {
    return NextResponse.json({ error: 'brandId and platform are required' }, { status: 400 });
  }

  // Verify ownership
  const brand = await prisma.brand.findFirst({
    where: { id: brandId, userId },
  });
  if (!brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
  }

  // Find the connection
  const connection = await prisma.socialConnection.findUnique({
    where: { brandId_platform: { brandId, platform } },
  });

  if (!connection) {
    return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
  }

  // Update to REVOKED status and clear tokens
  await prisma.socialConnection.update({
    where: { id: connection.id },
    data: {
      status: 'REVOKED',
      encryptedAccessToken: null,
      encryptedRefreshToken: null,
      iv: null,
      authTag: null,
      tokenExpiresAt: null,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      brandId,
      userId,
      action: 'PLATFORM_DISCONNECTED',
      metadata: JSON.stringify({ platform }),
    },
  });

  return NextResponse.json({ success: true });
});
