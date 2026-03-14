import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { withAuth } from '@royea/shared-utils/auth-guard';
import { fetchMetaPages } from '@/services/meta-accounts.service';

type RouteContext = { params: Promise<Record<string, never>> };

/**
 * GET /api/platforms/pages?brandId=xxx&platform=instagram|facebook
 *
 * Fetches available Facebook Pages (and linked IG accounts) using
 * the stored user access token. Used after OAuth to let the user
 * select which Page/account to publish to.
 */
export const GET = withAuth((async (req: NextRequest, userId: string) => {
  const brandId = req.nextUrl.searchParams.get('brandId');
  const platform = req.nextUrl.searchParams.get('platform');

  if (!brandId || !platform) {
    return NextResponse.json({ error: 'brandId and platform are required' }, { status: 400 });
  }

  if (platform !== 'instagram' && platform !== 'facebook') {
    return NextResponse.json({ error: 'Page selection only applies to Meta platforms' }, { status: 400 });
  }

  // Verify ownership
  const brand = await prisma.brand.findFirst({
    where: { id: brandId, userId },
  });
  if (!brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
  }

  // Get the connection with stored user token
  const connection = await prisma.socialConnection.findUnique({
    where: { brandId_platform: { brandId, platform } },
  });

  if (!connection || !connection.encryptedAccessToken || !connection.iv || !connection.authTag) {
    return NextResponse.json({ error: 'No connected account found. Please connect first.' }, { status: 404 });
  }

  // Decrypt user access token
  let userAccessToken: string;
  try {
    userAccessToken = decrypt(connection.encryptedAccessToken, connection.iv, connection.authTag);
  } catch {
    return NextResponse.json({ error: 'Failed to decrypt token. Please reconnect.' }, { status: 500 });
  }

  // Fetch available pages from Meta
  const result = await fetchMetaPages(userAccessToken);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  // Return pages without exposing access tokens
  const pages = result.pages.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    instagramBusinessAccount: p.instagramBusinessAccount
      ? {
          id: p.instagramBusinessAccount.id,
          username: p.instagramBusinessAccount.username,
          profilePictureUrl: p.instagramBusinessAccount.profilePictureUrl,
        }
      : null,
  }));

  return NextResponse.json({
    pages,
    currentPageId: connection.pageId || null,
  });
}) as unknown as import('@royea/shared-utils/auth-guard').AuthRouteHandler) as unknown as (req: NextRequest, _context: RouteContext) => Promise<NextResponse>;
