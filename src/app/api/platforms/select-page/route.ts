import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { decrypt, encrypt } from '@/lib/crypto';
import { withAuth } from '@royea/shared-utils/auth-guard';
import { fetchMetaPages } from '@/services/meta-accounts.service';

type RouteContext = { params: Promise<Record<string, never>> };

/**
 * POST /api/platforms/select-page
 *
 * After OAuth, the user selects which Facebook Page (and linked IG account)
 * to use for publishing. This endpoint:
 * 1. Fetches the page list using the user token
 * 2. Finds the selected page
 * 3. Encrypts and stores the Page Access Token
 * 4. Sets the connection to ACTIVE status
 */
export const POST = withAuth((async (req: NextRequest, userId: string) => {
  const body = await req.json();
  const { brandId, platform, pageId } = body;

  if (!brandId || !platform || !pageId) {
    return NextResponse.json(
      { error: 'brandId, platform, and pageId are required' },
      { status: 400 },
    );
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
    return NextResponse.json({ error: 'No connected account found' }, { status: 404 });
  }

  // Decrypt user access token to fetch pages
  let userAccessToken: string;
  try {
    userAccessToken = decrypt(connection.encryptedAccessToken, connection.iv, connection.authTag);
  } catch {
    return NextResponse.json({ error: 'Failed to decrypt token. Please reconnect.' }, { status: 500 });
  }

  // Fetch pages to get the page access token
  const result = await fetchMetaPages(userAccessToken);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  const selectedPage = result.pages.find((p) => p.id === pageId);
  if (!selectedPage) {
    return NextResponse.json({ error: 'Selected page not found' }, { status: 404 });
  }

  // For Instagram, the page must have a linked IG Business account
  if (platform === 'instagram' && !selectedPage.instagramBusinessAccount) {
    return NextResponse.json(
      { error: 'This page has no linked Instagram Business account' },
      { status: 400 },
    );
  }

  // Encrypt the Page Access Token separately
  const encryptedPageToken = encrypt(selectedPage.accessToken);

  // Determine the platform-specific account info
  const igAccount = selectedPage.instagramBusinessAccount;
  const accountName = platform === 'instagram' && igAccount
    ? `@${igAccount.username}`
    : selectedPage.name;
  const platformUserId = platform === 'instagram' && igAccount
    ? igAccount.id
    : selectedPage.id;

  // Update the connection with page info
  await prisma.socialConnection.update({
    where: { id: connection.id },
    data: {
      pageId: selectedPage.id,
      pageName: selectedPage.name,
      pageAccessTokenEncrypted: encryptedPageToken.encrypted,
      pageTokenIv: encryptedPageToken.iv,
      pageTokenAuthTag: encryptedPageToken.authTag,
      platformUserId,
      accountName,
      accountType: platform === 'instagram' ? 'business' : 'page',
      status: 'ACTIVE',
      lastSyncAt: new Date(),
      metadata: JSON.stringify({
        pageCategory: selectedPage.category,
        igUsername: igAccount?.username || null,
        igProfilePic: igAccount?.profilePictureUrl || null,
      }),
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      brandId,
      userId,
      action: 'PAGE_SELECTED',
      metadata: JSON.stringify({
        platform,
        pageId: selectedPage.id,
        pageName: selectedPage.name,
        accountName,
      }),
    },
  });

  return NextResponse.json({
    success: true,
    accountName,
    pageName: selectedPage.name,
    status: 'ACTIVE',
  });
}) as unknown as import('@royea/shared-utils/auth-guard').AuthRouteHandler) as unknown as (req: NextRequest, _context: RouteContext) => Promise<NextResponse>;
